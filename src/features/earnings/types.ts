import type { CalendarDate } from '@/shared/utils/date';

/** Money the employee has earned and been paid, all time (GET /employee/salary). */
export interface SalarySummary {
  /** Approved earnings: Σ accepted pieces × rate of reviewed work. */
  totalEarned: number;
  /** Payouts an admin has recorded. */
  totalPaid: number;
  /** Earned and not yet paid. */
  remainingBalance: number;
  totalAcceptedGarments: number;
  currency: string;
}

/** Reviewed work and what it earned. */
export interface ApprovedEarning {
  assignmentId: string;
  orderNumber: string;
  serviceName: string | null;
  date: CalendarDate;
  acceptedQuantity: number;
  completedQuantity: number;
  amount: number;
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'ONLINE_CARD' | 'OTHER';

/** A payout an admin recorded. */
export interface SalaryPayment {
  id: string;
  paymentNumber: string;
  amount: number;
  method: PaymentMethod;
  /** Backend timestamp. */
  paidAt: string;
  referenceNumber: string | null;
  notes: string | null;
}

export interface Salary {
  summary: SalarySummary;
  approved: ApprovedEarning[];
  payments: SalaryPayment[];
}

/** A period of days the earnings screens cover, both ends included. */
export interface EarningsPeriod {
  start: CalendarDate;
  end: CalendarDate;
}

export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'last7Days' | 'last30Days';

/** One row of the earnings history (E 4.2). */
export interface EarningsHistoryRow {
  id: string;
  date: CalendarDate;
  orderNumber: string;
  serviceName: string | null;
  /** Accepted pieces once approved, reported pieces while pending. */
  items: number;
  amount: number;
  status: 'approved' | 'pending';
}

/** One bar of the approved-earnings chart (E 4.1). */
export interface ChartBar {
  key: string;
  /** Day of month under the bar, or empty to skip a label on long periods. */
  label: string;
  /** Bar height as a share of the tallest bar, 0 to 1. */
  fraction: number;
  accessibilityLabel: string;
}
