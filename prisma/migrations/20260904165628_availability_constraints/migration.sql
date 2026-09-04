-- =============================================================================
-- Availability enforcement — the rules Prisma cannot express
-- =============================================================================
--
-- Run after `prisma migrate dev`, as a manual migration:
--   npx prisma migrate dev --create-only --name availability_constraints
--   (paste this into the generated migration.sql, then `prisma migrate dev`)
--
-- WHY ANY OF THIS IS IN THE DATABASE
-- An application check protects the code path you wrote it in. A database
-- constraint protects every path — the admin bulk import, the seed script, the
-- manual fix at 2am, and the second booking endpoint someone adds next year
-- without reading your code.
--
-- It also closes a race the application layer cannot: read the row, decide the
-- surface is free, write the booking. Those are separate operations, and a
-- concurrent request can land between them. Both see "free", both write, and
-- one physical bus panel is now sold to two advertisers. The failure is silent
-- — nothing errors, both contracts look fine, and you find out when a fitter
-- arrives at the depot holding the wrong vinyl.
--
-- The most common trigger isn't contention, it's a double-click or a client
-- retry after a stalled connection: the identical race, caused by one person.
-- =============================================================================
 
 
-- -----------------------------------------------------------------------------
-- 1. Extension
-- -----------------------------------------------------------------------------
-- Needed so a GiST index can handle the equality half of the constraint on a
-- text column. Without it, `"assetId" WITH =` has no GiST operator class.
-- Prisma declares this too (extensions = [btree_gist]); kept here so the
-- migration stands alone.
 
CREATE EXTENSION IF NOT EXISTS btree_gist;
 
 
-- -----------------------------------------------------------------------------
-- 2. Period alignment  — the trading calendar, enforced
-- -----------------------------------------------------------------------------
-- Bookings start on a Monday and run whole weeks. The reason is operational:
-- fitting is batched labour. A crew does an entire depot in one changeover run,
-- because dispatching a van to hang one panel costs more than the panel earns.
-- Arbitrary start dates would mean a separate dispatch per booking, which no
-- OOH operator does.
--
-- Enforcing it here means the pricing model never has to answer "what's half a
-- period worth" — you cannot sell one.
--
-- ISODOW: Monday = 1. EXTRACT on a `date` is immutable, so it is legal in a
-- CHECK constraint. (On timestamptz it is only stable, and would be rejected.)
-- `date - date` returns an integer number of days.
 
ALTER TABLE "ContractLine"
  ADD CONSTRAINT "contract_line_window_positive"
  CHECK ("endsOn" > "startsOn");
 
ALTER TABLE "ContractLine"
  ADD CONSTRAINT "contract_line_starts_monday"
  CHECK (EXTRACT(ISODOW FROM "startsOn") = 1);
 
-- Whole weeks. Combined with the Monday start this also guarantees endsOn
-- lands on a Monday, so no separate constraint is needed for it.
ALTER TABLE "ContractLine"
  ADD CONSTRAINT "contract_line_whole_weeks"
  CHECK (("endsOn" - "startsOn") % 7 = 0);
 
ALTER TABLE "ContractLine"
  ADD CONSTRAINT "contract_line_slots_positive"
  CHECK ("slots" >= 1);
 
-- Same rules on the demand side, so a malformed request can never be converted
-- into a contract that would fail at the last step.
ALTER TABLE "BookingRequestItem"
  ADD CONSTRAINT "request_item_window_positive"
  CHECK ("endsOn" > "startsOn");
 
ALTER TABLE "BookingRequestItem"
  ADD CONSTRAINT "request_item_starts_monday"
  CHECK (EXTRACT(ISODOW FROM "startsOn") = 1);
 
ALTER TABLE "BookingRequestItem"
  ADD CONSTRAINT "request_item_whole_weeks"
  CHECK (("endsOn" - "startsOn") % 7 = 0);
 
 
-- -----------------------------------------------------------------------------
-- 3. Static double-booking  — the headline constraint
-- -----------------------------------------------------------------------------
-- One poster, one surface, one advertiser. Two bookings on the same asset whose
-- date ranges overlap cannot both exist.
--
-- `[)` is half-open, matching the schema convention: a campaign ending 21 Sep
-- and one starting 21 Sep do NOT overlap. This is the whole reason endsOn is
-- exclusive.
--
-- The WHERE clause is doing two jobs:
--   "isExclusive"  — digital surfaces sell shared loop slots, so they are
--                    exempt. This is why isExclusive is denormalised onto the
--                    line: an exclusion constraint can only see columns on the
--                    row it is checking, and cannot join to Asset to look up
--                    the medium.
--   status         — RELEASED and CANCELLED lines stay in the table for audit
--                    but stop blocking. HELD is a soft hold (expiring, see §5),
--                    BOOKED is firm; both block.
 
ALTER TABLE "ContractLine"
  ADD CONSTRAINT "contract_line_no_double_booking"
  EXCLUDE USING gist (
    "assetId" WITH =,
    daterange("startsOn", "endsOn", '[)') WITH &&
  )
  WHERE (
    "isExclusive"
    AND "status" IN ('HELD'::"ContractLineStatus", 'BOOKED'::"ContractLineStatus")
  );
 
-- If your Postgres build does not pick the btree_gist opclass automatically,
-- make it explicit:  "assetId" gist_text_ops WITH =
 
 
-- -----------------------------------------------------------------------------
-- 4. Digital loop capacity
-- -----------------------------------------------------------------------------
-- Digital screens are not exclusive. They sell share of loop: a 60-second loop
-- of six 10-second slots, six advertisers rotating. Availability is therefore
-- a SUM over overlapping lines, not a binary conflict — and a SUM across
-- sibling rows cannot be expressed as a row-level constraint.
--
-- So: a trigger. It takes a FOR UPDATE lock on the Asset row first, which
-- serialises concurrent bookings for that screen and closes the same
-- read-then-write race the exclusion constraint closes for static surfaces.
--
-- ON CORRECTNESS: the naive version sums every overlapping line, which is
-- over-conservative. If two 2-slot bookings sit in non-overlapping halves of a
-- four-week window, a summed total of 4 would wrongly reject a new 3-slot
-- booking on a 6-slot loop, even though peak concurrent usage is only 5.
-- This walks the interval start boundaries instead — peak occupancy of a set
-- of intervals always occurs at one of their start points — so it checks true
-- concurrent usage.
 
CREATE OR REPLACE FUNCTION check_digital_slot_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_loop_slots INT;
  v_used       INT;
  v_point      DATE;
BEGIN
  -- Static surfaces are handled by the exclusion constraint above.
  IF NEW."isExclusive" THEN
    RETURN NEW;
  END IF;
 
  -- Non-blocking states don't consume capacity.
  IF NEW."status" NOT IN ('HELD'::"ContractLineStatus", 'BOOKED'::"ContractLineStatus") THEN
    RETURN NEW;
  END IF;
 
  -- Serialise concurrent bookings for this screen.
  SELECT "loopSlots" INTO v_loop_slots
  FROM "Asset"
  WHERE "id" = NEW."assetId"
  FOR UPDATE;
 
  IF v_loop_slots IS NULL THEN
    RAISE EXCEPTION
      'Asset % is digital but has no loopSlots configured', NEW."assetId"
      USING ERRCODE = 'check_violation';
  END IF;
 
  -- Peak occupancy occurs at an interval start: check our own start, plus the
  -- start of every other blocking line that begins inside our window.
  FOR v_point IN
    SELECT NEW."startsOn"
    UNION
    SELECT cl."startsOn"
      FROM "ContractLine" cl
     WHERE cl."assetId" = NEW."assetId"
       AND cl."id" <> NEW."id"
       AND cl."status" IN ('HELD'::"ContractLineStatus", 'BOOKED'::"ContractLineStatus")
       AND cl."startsOn" > NEW."startsOn"
       AND cl."startsOn" < NEW."endsOn"
  LOOP
    SELECT COALESCE(SUM(cl."slots"), 0) INTO v_used
      FROM "ContractLine" cl
     WHERE cl."assetId" = NEW."assetId"
       AND cl."id" <> NEW."id"
       AND cl."status" IN ('HELD'::"ContractLineStatus", 'BOOKED'::"ContractLineStatus")
       AND cl."startsOn" <= v_point
       AND cl."endsOn"   >  v_point;
 
    IF v_used + NEW."slots" > v_loop_slots THEN
      RAISE EXCEPTION
        'Digital loop full on asset % from %: % of % slots already sold, requested %',
        NEW."assetId", v_point, v_used, v_loop_slots, NEW."slots"
        USING ERRCODE = 'exclusion_violation';
    END IF;
  END LOOP;
 
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER contract_line_digital_capacity
  BEFORE INSERT OR UPDATE ON "ContractLine"
  FOR EACH ROW
  EXECUTE FUNCTION check_digital_slot_capacity();
 
 
-- -----------------------------------------------------------------------------
-- 5. Hold expiry
-- -----------------------------------------------------------------------------
-- DRAFT contracts hold inventory softly so ops can build a quote without a
-- competitor grabbing the panel mid-conversation. Without expiry, abandoned
-- drafts sterilise inventory forever.
--
-- Call from a Vercel cron route, or just before an availability query.
-- Kept as SQL rather than application code because it is a data rule, and the
-- sweep must not depend on anyone remembering to run it from the right place.
 
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE "ContractLine"
     SET "status" = 'RELEASED'::"ContractLineStatus",
         "updatedAt" = NOW()
   WHERE "status" = 'HELD'::"ContractLineStatus"
     AND "holdExpiresAt" IS NOT NULL
     AND "holdExpiresAt" < NOW();
 
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
 
 
-- -----------------------------------------------------------------------------
-- 6. Catching these in the application
-- -----------------------------------------------------------------------------
-- Prisma surfaces raw Postgres errors as P2010 with the SQLSTATE attached.
-- Map them to clean domain errors rather than letting a 500 reach the UI:
--
--   23P01  exclusion_violation  — surface already booked for that window
--                                 (both the static constraint and the digital
--                                  trigger raise this, so one handler covers
--                                  both inventory types)
--   23514  check_violation      — window not Monday-aligned or not whole weeks;
--                                 this is a bug in the date picker, not user
--                                 error, so log it loudly
--
-- The point is that the write is attempted and rejected atomically. There is
-- no check-then-write gap to lose.
 