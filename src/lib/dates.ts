/**
 * The trading calendar.
 *
 * Every booking window in the app is HALF-OPEN — [startsOn, endsOn) — and both
 * ends are Mondays. `endsOn` is EXCLUSIVE and is never a day the ad is live, so
 * a campaign ending 19 Oct and one starting 19 Oct do not conflict. That single
 * convention is what the database's exclusion constraint relies on.
 *
 * Bookings start on Mondays and run whole weeks because fitting is batched
 * labour: a crew does an entire depot in one changeover run, and nobody
 * dispatches a van to hang one panel. The constraint comes from the operations,
 * not the UI. It also removes proration — you cannot sell half a period.
 *
 * ALL DATES ARE UTC MIDNIGHT, and all date arithmetic in the app lives in this
 * file. Nothing else should touch timezones: local-time arithmetic across a DST
 * boundary silently shifts a "Monday" by an hour and lands it on a Sunday, and
 * the check constraint then rejects a window the picker just offered.
 */

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** ISO day-of-week for Monday, matching Postgres `EXTRACT(ISODOW ...)`. */
const MONDAY = 1;

/** Build a UTC-midnight date from calendar parts. Month is 1-based. */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Strip the time component, keeping the UTC calendar day. Everything entering
 * this module goes through here, so a `new Date()` carrying a wall-clock time
 * cannot leak into the arithmetic.
 */
export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Parse a date-only string ("2026-10-05") as UTC midnight. */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${value}"`);
  }
  return utcDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** Format as a date-only string ("2026-10-05"), for form values and SQL. */
export function toDateOnly(date: Date): string {
  return toUtcMidnight(date).toISOString().slice(0, 10);
}

export function isMonday(date: Date): boolean {
  return toUtcMidnight(date).getUTCDay() === MONDAY;
}

export function addDays(date: Date, days: number): Date {
  return new Date(toUtcMidnight(date).getTime() + days * MS_PER_DAY);
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * The next Monday on or after `date`. A date that is already a Monday is
 * returned unchanged — the "or after" is what keeps nextValidStart from
 * skipping a week when lead time lands exactly on one.
 */
export function nextMondayOnOrAfter(date: Date): Date {
  const day = toUtcMidnight(date).getUTCDay();
  // getUTCDay is Sunday-0; (8 - day) % 7 is the distance forward to Monday,
  // and 0 when we are already there.
  return addDays(date, (8 - day) % 7);
}

/**
 * The earliest date a client may start a campaign on this asset.
 *
 * ORDER MATTERS: add the lead time FIRST, then round up to a Monday. Lead time
 * is a physical constraint — print, dispatch and get the vinyl to the depot —
 * so rounding first would offer a start the printer cannot meet. Rounding after
 * always lands on or after the true earliest date.
 */
export function nextValidStart(from: Date, leadTimeDays: number): Date {
  return nextMondayOnOrAfter(addDays(from, leadTimeDays));
}

/**
 * Whole weeks in a half-open window. Throws rather than rounding: a fractional
 * result means a non-aligned date reached this point, which is a bug in the
 * picker and not something to paper over with Math.round.
 */
export function weeksBetween(startsOn: Date, endsOn: Date): number {
  const ms = toUtcMidnight(endsOn).getTime() - toUtcMidnight(startsOn).getTime();
  const weeks = ms / MS_PER_WEEK;
  if (!Number.isInteger(weeks)) {
    throw new Error(
      `Window ${toDateOnly(startsOn)} → ${toDateOnly(endsOn)} is not a whole number of weeks`,
    );
  }
  return weeks;
}

/** The end date of a booking that starts on `startsOn` and runs `weeks` weeks. */
export function endsOnFor(startsOn: Date, weeks: number): Date {
  return addWeeks(startsOn, weeks);
}

/**
 * The durations an asset actually sells: from `minWeeks`, in `stepWeeks`
 * increments, up to `max`. A billboard with minWeeks 2 / stepWeeks 2 sells
 * 2, 4, 6 — never 3. The picker generates these, so the client never types a
 * raw date or an invalid length.
 */
export function validDurations(
  minWeeks: number,
  stepWeeks: number,
  max = 26,
): number[] {
  if (minWeeks < 1) throw new Error("minWeeks must be at least 1");
  if (stepWeeks < 1) throw new Error("stepWeeks must be at least 1");

  const durations: number[] = [];
  for (let weeks = minWeeks; weeks <= max; weeks += stepWeeks) {
    durations.push(weeks);
  }
  return durations;
}

/**
 * The Mondays a client may choose from, starting at the earliest valid one.
 * Used by the browse date picker so a raw date input is never rendered.
 */
export function validStartDates(
  from: Date,
  leadTimeDays: number,
  count = 26,
): Date[] {
  const first = nextValidStart(from, leadTimeDays);
  return Array.from({ length: count }, (_, index) => addWeeks(first, index));
}

/** Half-open overlap test, mirroring the database's `daterange(..., '[)')`. */
export function windowsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
