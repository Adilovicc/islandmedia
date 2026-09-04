/**
 * Money is integer pence, everywhere — in the database, in the domain, and in
 * every calculation. Never a float, never a Decimal.
 *
 * Floats cannot represent a tenth exactly, so 0.1 + 0.2 is 0.30000000000000004
 * and a long enough invoice drifts by a penny. Integers make every arithmetic
 * step exact, and formatting is the only place a decimal point appears.
 */

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Integer pence in, display string out: 123400 -> "£1,234.00". */
export function formatPence(pence: number): string {
  if (!Number.isInteger(pence)) {
    throw new Error(`Money must be integer pence, received ${pence}`);
  }
  return GBP.format(pence / 100);
}

/** A line total, priced from the rate SNAPSHOT held on the contract line. */
export function lineTotalPence(weekRatePence: number, weeks: number): number {
  if (!Number.isInteger(weekRatePence)) {
    throw new Error(`Rate must be integer pence, received ${weekRatePence}`);
  }
  if (!Number.isInteger(weeks) || weeks < 1) {
    throw new Error(`Weeks must be a positive integer, received ${weeks}`);
  }
  return weekRatePence * weeks;
}

/** Sum of line totals. Integers in, integer out — no rounding step exists. */
export function sumPence(amounts: number[]): number {
  return amounts.reduce((total, amount) => {
    if (!Number.isInteger(amount)) {
      throw new Error(`Money must be integer pence, received ${amount}`);
    }
    return total + amount;
  }, 0);
}
