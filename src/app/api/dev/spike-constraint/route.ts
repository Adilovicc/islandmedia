import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { utcDate } from "@/lib/dates";

/**
 * SPIKE A — the exclusion constraint, on Neon.
 *
 * Proves three things that the whole booking model rests on:
 *
 *   1. btree_gist and the GiST exclusion constraint actually exist on Neon,
 *      which is not a given for a managed Postgres.
 *   2. An overlapping window on the same STATIC asset is REJECTED by the
 *      database, with SQLSTATE 23P01 — not by application code that a second
 *      endpoint could forget to call.
 *   3. An ADJACENT window is ACCEPTED. This is the half-open convention paying
 *      rent: a line ending 19 Oct and one starting 19 Oct do not overlap. If
 *      this failed, every date in the app would be off by a day.
 *
 * Everything is rolled back, so the spike leaves no rows behind.
 *
 * THE SAVEPOINT MATTERS. In Postgres a failed statement aborts the entire
 * transaction: every later statement returns 25P02 "current transaction is
 * aborted" until it is rolled back. Without a savepoint around insert B, insert
 * C would fail for that reason rather than on its own merits, and the spike
 * would report a false negative on the most important assertion it makes.
 */

export const dynamic = "force-dynamic";

/** Roll the whole spike back by throwing something recognisable. */
class RollbackSignal extends Error {
  constructor(readonly result: SpikeResult) {
    super("spike complete, rolling back");
  }
}

type SpikeResult = {
  aInserted: boolean;
  bRejectedWith: string | null;
  cInserted: boolean;
};

/**
 * Postgres surfaces the SQLSTATE in different places depending on whether the
 * failure came through the query engine or the driver, so check all of them
 * rather than trusting one shape.
 */
function sqlstateOf(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;

  const candidate = error as {
    code?: unknown;
    meta?: { code?: unknown; dbError?: { code?: unknown } };
    message?: unknown;
  };

  const direct = candidate.meta?.dbError?.code ?? candidate.meta?.code;
  if (typeof direct === "string" && /^\d{2}[0-9A-Z]{3}$/.test(direct)) return direct;
  if (typeof candidate.code === "string" && /^\d{2}[0-9A-Z]{3}$/.test(candidate.code)) {
    return candidate.code;
  }

  if (typeof candidate.message === "string") {
    const match = /\b(\d{2}[0-9A-Z]{3})\b/.exec(candidate.message);
    if (match) return match[1];
  }
  return null;
}

export async function GET() {
  const suffix = Math.random().toString(36).slice(2, 10);

  // Windows are Mondays, half-open. A: [05 Oct, 19 Oct)
  const aStart = utcDate(2026, 10, 5);
  const aEnd = utcDate(2026, 10, 19);
  // B overlaps A by a week -> must be rejected.
  const bStart = utcDate(2026, 10, 12);
  const bEnd = utcDate(2026, 10, 26);
  // C starts the day A ends -> must be accepted.
  const cStart = utcDate(2026, 10, 19);
  const cEnd = utcDate(2026, 11, 2);

  try {
    await prisma.$transaction(async (tx) => {
      const result: SpikeResult = { aInserted: false, bRejectedWith: null, cInserted: false };

      const client = await tx.client.create({
        data: {
          name: `Spike Client ${suffix}`,
          contactName: "Spike Contact",
          contactEmail: `spike-${suffix}@example.test`,
        },
      });

      const user = await tx.user.create({
        data: { email: `spike-${suffix}@islandmedia.test`, name: "Spike Runner", role: "ADMIN" },
      });

      const site = await tx.site.create({
        data: { name: `Spike Site ${suffix}`, kind: "ROADSIDE", address: "1 Spike Road" },
      });

      const asset = await tx.asset.create({
        data: {
          code: `SPIKE-${suffix}`,
          name: "Spike billboard",
          type: "BILLBOARD",
          medium: "STATIC",
          siteId: site.id,
          weekRatePence: 100_000,
        },
      });

      const contract = await tx.contract.create({
        data: {
          number: `SPIKE-${suffix}`,
          clientId: client.id,
          createdById: user.id,
        },
      });

      const line = (startsOn: Date, endsOn: Date, weeks: number) => ({
        contractId: contract.id,
        assetId: asset.id,
        startsOn,
        endsOn,
        // Denormalised from asset.medium at creation: the constraint can only
        // see columns on the row it is checking.
        isExclusive: true,
        status: "HELD" as const,
        weeks,
        weekRatePence: 100_000,
        lineTotalPence: 100_000 * weeks,
      });

      // --- A: must succeed --------------------------------------------------
      await tx.contractLine.create({ data: line(aStart, aEnd, 2) });
      result.aInserted = true;

      // --- B: overlapping, must be rejected with 23P01 ----------------------
      await tx.$executeRawUnsafe("SAVEPOINT before_overlap");
      try {
        await tx.contractLine.create({ data: line(bStart, bEnd, 2) });
        // Reaching here means the constraint is missing or not enforcing.
        await tx.$executeRawUnsafe("RELEASE SAVEPOINT before_overlap");
        result.bRejectedWith = "NOT REJECTED — the exclusion constraint did not fire";
      } catch (error) {
        result.bRejectedWith = sqlstateOf(error) ?? "rejected, but SQLSTATE not readable";
        // Undo the aborted statement so the transaction is usable again.
        await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT before_overlap");
      }

      // --- C: adjacent, must succeed ---------------------------------------
      await tx.contractLine.create({ data: line(cStart, cEnd, 2) });
      result.cInserted = true;

      throw new RollbackSignal(result);
    });

    return NextResponse.json({ error: "transaction unexpectedly committed" }, { status: 500 });
  } catch (error) {
    if (error instanceof RollbackSignal) {
      const { aInserted, bRejectedWith, cInserted } = error.result;
      const passed = aInserted && bRejectedWith === "23P01" && cInserted;

      return NextResponse.json(
        {
          spike: "A — exclusion constraint",
          passed,
          aInserted,
          bRejectedWith,
          cInserted,
          rolledBack: true,
          explains: {
            a: "05 Oct to 19 Oct on a STATIC asset, HELD. Inserted.",
            b: "12 Oct to 26 Oct on the same asset overlaps A. Expect SQLSTATE 23P01.",
            c: "19 Oct to 02 Nov starts the day A ends. Half-open, so no overlap. Expect success.",
          },
        },
        { status: passed ? 200 : 500 },
      );
    }

    return NextResponse.json(
      { spike: "A — exclusion constraint", passed: false, error: String(error) },
      { status: 500 },
    );
  }
}
