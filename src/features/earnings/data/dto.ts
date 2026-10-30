import { z } from 'zod';

/** One reviewed assignment in GET /api/v1/employee/salary `acceptedAssignments` (API_CONTRACT §11.1). */
export const salaryAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  orderId: z.string(),
  orderNumber: z.string(),
  customerName: z.string().nullish(),
  branchName: z.string().nullish(),
  garmentDescription: z.string().nullish(),
  serviceName: z.string().nullish(),
  serviceCode: z.string().nullish(),
  /** A DATE column serialised as UTC midnight: a calendar day, not an instant. */
  assignmentDate: z.string(),
  targetQuantity: z.number(),
  completedQuantity: z.number(),
  acceptedQuantity: z.number(),
  unitEmployeeRate: z.number(),
  /** acceptedQuantity × unitEmployeeRate, rounded to cents. */
  earnedAmount: z.number(),
  reviewedAt: z.string().nullish(),
  workerNotes: z.string().nullish(),
  reviewNotes: z.string().nullish(),
  customerSignatureUrl: z.string().nullish(),
});

/** One payout an admin recorded, in `payments`. */
export const salaryPaymentSchema = z.object({
  id: z.string().min(1),
  paymentNumber: z.string(),
  amount: z.number(),
  currency: z.string(),
  /** BANK_TRANSFER | CASH | CHEQUE | ONLINE_CARD */
  paymentMethod: z.string(),
  paidAt: z.string(),
  referenceNumber: z.string().nullish(),
  notes: z.string().nullish(),
  /** The admin's name or user name. */
  paidBy: z.string().nullish(),
  createdAt: z.string().optional(),
});

/** `data` of GET /api/v1/employee/salary. Lists are validated item by item with parseItems. */
export const salaryResponseSchema = z.object({
  employee: z
    .object({
      id: z.string(),
      userId: z.string().nullish(),
      name: z.string().nullish(),
      role: z.string().optional(),
    })
    .optional(),
  salarySummary: z.object({
    /** Σ earnedAmount of every REVIEWED assignment. */
    totalEarned: z.number(),
    /** Σ amount of every recorded payment. */
    totalPaid: z.number(),
    /** max(0, totalEarned − totalPaid). */
    remainingBalance: z.number(),
    totalAcceptedGarments: z.number(),
    paymentCount: z.number(),
    currency: z.string(),
  }),
  acceptedAssignments: z.array(z.unknown()),
  payments: z.array(z.unknown()),
});

export type SalaryAssignmentDto = z.infer<typeof salaryAssignmentSchema>;
export type SalaryPaymentDto = z.infer<typeof salaryPaymentSchema>;

/** The salary payload as the mock builds it. */
export interface SalaryResponseDto {
  employee: { id: string; userId: string | null; name: string | null; role: string };
  salarySummary: z.infer<typeof salaryResponseSchema>['salarySummary'];
  acceptedAssignments: SalaryAssignmentDto[];
  payments: SalaryPaymentDto[];
}
