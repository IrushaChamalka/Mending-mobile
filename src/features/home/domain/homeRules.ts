import { formatAmount } from '@/shared/utils/number';

/** "Good morning," before noon, "Good afternoon," until 5 pm, then "Good evening," (E 2.1). */
export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export interface BalanceParts {
  approved: number;
  withdrawn: number;
  /** Held by requests waiting for the admin. */
  pending: number;
}

/**
 * The line under the balance: "Approved 25,560 – withdrawn 10,000" (E 2.1), plus the held amount
 * when a request is waiting, so the three numbers always add up to what is shown above them.
 */
export function balanceBreakdown({ approved, withdrawn, pending }: BalanceParts): string {
  const parts = [`Approved ${formatAmount(approved)}`, `withdrawn ${formatAmount(withdrawn)}`];
  if (pending > 0) parts.push(`pending ${formatAmount(pending)}`);
  return parts.join(' – ');
}

/** How many of today's tasks Home shows before "See all". */
export const TODAYS_TASKS_LIMIT = 3;
