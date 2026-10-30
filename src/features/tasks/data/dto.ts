import { z } from 'zod';

import { TASK_STATUSES } from '@/shared/api/taskStatus';

/** `orderLine` of a my-tasks item (API_CONTRACT §5.3). */
const myTaskOrderLineSchema = z.object({
  orderLineId: z.string(),
  unitRate: z.number().optional(),
  lineNumber: z.number().nullish(),
  garmentDescription: z.string().nullish(),
  serviceName: z.string().nullish(),
  serviceCode: z.string().nullish(),
  color: z.string().nullish(),
  size: z.string().nullish(),
  styleNumber: z.string().nullish(),
});

/** One item of GET /api/v1/orders/my-tasks. */
export const myTaskSchema = z.object({
  assignmentId: z.string().min(1),
  orderId: z.string(),
  orderNumber: z.string().nullish(),
  customerName: z.string().nullish(),
  /** Customer site branch, or "Internal workshop". */
  location: z.string().nullish(),
  orderLine: myTaskOrderLineSchema,
  /** LKR per piece (the order line's unitEmployeeRate). */
  unitRate: z.number().optional(),
  /** targetQuantity × unitRate. */
  estimatedPayout: z.number().optional(),
  /** completedQuantity × unitRate. */
  completedPayout: z.number().optional(),
  /** acceptedQuantity × unitRate. */
  acceptedPayout: z.number().optional(),
  /** A DATE column serialised as UTC midnight: a calendar day, not an instant. */
  assignmentDate: z.string(),
  acceptedAt: z.string().nullish(),
  targetQuantity: z.number(),
  completedQuantity: z.number(),
  acceptedQuantity: z.number(),
  /** The submitted photo: an https URL, or a data: URI in seed data. */
  customerSignatureUrl: z.string().nullish(),
  status: z.enum(TASK_STATUSES),
  /** workerNotes: the assigner's note before submission, the worker's note after (Gap 18). */
  notes: z.string().nullish(),
  reviewNotes: z.string().nullish(),
  submittedAt: z.string().nullish(),
  reviewedAt: z.string().nullish(),
  /** Set when the employee declined the task (status REJECTED). */
  rejectedAt: z.string().nullish(),
  rejectionReason: z.string().nullish(),
});

/** `data` of GET /api/v1/orders/my-tasks. Items are validated one by one with parseItems. */
export const myTasksResponseSchema = z.object({
  date: z.string().optional(),
  totalTasks: z.number().optional(),
  tasks: z.array(z.unknown()),
});

/**
 * `data` of PATCH …/accept (and of submit-work and review): the DailyAssignment entity
 * (API_CONTRACT §5.4). Only `id` and `status` are required; the rest documents the shape.
 */
export const dailyAssignmentSchema = z.object({
  id: z.string().min(1),
  status: z.enum(TASK_STATUSES),
  acceptedAt: z.string().nullish(),
  orderId: z.string().optional(),
  orderLineId: z.string().optional(),
  employeeId: z.string().optional(),
  assignmentDate: z.string().optional(),
  targetQuantity: z.number().optional(),
  completedQuantity: z.number().optional(),
  acceptedQuantity: z.number().optional(),
  customerSignatureUrl: z.string().nullish(),
  workerNotes: z.string().nullish(),
  submittedAt: z.string().nullish(),
  reviewNotes: z.string().nullish(),
  reviewedById: z.string().nullish(),
  reviewedAt: z.string().nullish(),
  assignedById: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type MyTaskDto = z.infer<typeof myTaskSchema>;
export type DailyAssignmentDto = z.infer<typeof dailyAssignmentSchema>;

/** The my-tasks payload as the mock builds it. */
export interface MyTasksResponseDto {
  date: string;
  totalTasks: number;
  tasks: MyTaskDto[];
}
