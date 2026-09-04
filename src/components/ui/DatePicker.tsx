import { Select } from "./Select";
import { toDateOnly, validDurations, validStartDates } from "@/lib/dates";

/**
 * The start-date picker.
 *
 * It is a Select, not a date input, and that is a domain decision rather than a
 * styling one: bookings start on Mondays and run whole weeks, so most dates a
 * calendar would offer are invalid. Generating the legal options means the
 * client cannot compose a window the database will reject — the check
 * constraint becomes a backstop instead of an error message.
 *
 * Lead time is applied before the Monday is chosen, so the earliest option is
 * always one the printer can actually meet.
 */
export function DatePicker({
  label = "Start date",
  name = "startsOn",
  leadTimeDays,
  from = new Date(),
  count = 26,
  hint,
  error,
  defaultValue,
  required,
}: {
  label?: string;
  name?: string;
  leadTimeDays: number;
  from?: Date;
  count?: number;
  hint?: string;
  error?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const options = validStartDates(from, leadTimeDays, count).map((date) => ({
    value: toDateOnly(date),
    label: date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  }));

  return (
    <Select
      label={label}
      name={name}
      hint={hint ?? "Campaigns start on a Monday."}
      error={error}
      options={options}
      defaultValue={defaultValue}
      required={required}
    />
  );
}

/**
 * The companion duration picker. An asset with minWeeks 2 and stepWeeks 2 sells
 * 2, 4 or 6 weeks — never 3 — so the list is generated from the asset's own
 * trading rules rather than validated after the fact.
 */
export function DurationPicker({
  label = "Duration",
  name = "weeks",
  minWeeks,
  stepWeeks,
  max = 26,
  hint,
  error,
  defaultValue,
  required,
}: {
  label?: string;
  name?: string;
  minWeeks: number;
  stepWeeks: number;
  max?: number;
  hint?: string;
  error?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const options = validDurations(minWeeks, stepWeeks, max).map((weeks) => ({
    value: String(weeks),
    label: weeks === 1 ? "1 week" : `${weeks} weeks`,
  }));

  return (
    <Select
      label={label}
      name={name}
      hint={hint}
      error={error}
      options={options}
      defaultValue={defaultValue}
      required={required}
    />
  );
}
