import { z } from 'zod';

/**
 * PROPOSED shapes. The backend has no withdrawal-request or payout-account endpoints yet
 * (API_CONTRACT §9, Gaps 22–23). Only the mock api serves them, behind `features.withdrawalRequests`
 * and `features.payoutAccount`. Update these when the backend team publishes the real contract.
 */
export const payoutAccountSchema = z.object({
  id: z.string().min(1),
  bankName: z.string(),
  /** Short bank name for tight rows, e.g. "BOC". */
  bankCode: z.string(),
  branchName: z.string().nullish(),
  accountHolderName: z.string(),
  accountNumberLast4: z.string(),
  verified: z.boolean(),
});

export const WITHDRAWAL_STATUSES = ['PENDING', 'PAID', 'REJECTED'] as const;

export const withdrawalSchema = z.object({
  id: z.string().min(1),
  /** e.g. "WD-2026-0031". */
  referenceNumber: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(WITHDRAWAL_STATUSES),
  requestedAt: z.string(),
  decidedAt: z.string().nullish(),
  rejectionReason: z.string().nullish(),
  payoutAccount: payoutAccountSchema.pick({
    bankName: true,
    bankCode: true,
    accountNumberLast4: true,
  }),
});

/** `data` of GET /employee/withdrawals (proposed). Items are validated one by one. */
export const withdrawalListSchema = z.object({
  withdrawals: z.array(z.unknown()),
});

/** Body of POST /employee/withdrawals (proposed). */
export interface CreateWithdrawalRequestDto {
  amount: number;
  payoutAccountId: string;
}

export type PayoutAccountDto = z.infer<typeof payoutAccountSchema>;
export type WithdrawalDto = z.infer<typeof withdrawalSchema>;
