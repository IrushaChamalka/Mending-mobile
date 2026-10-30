import type { TaskStatus } from '@/shared/api/taskStatus';
import type { CalendarDate } from '@/shared/utils/date';

export type { TaskStatus } from '@/shared/api/taskStatus';

export interface TaskTarget {
  /** Pieces to finish (targetQuantity). 0 means no target was set. */
  value: number;
  /** Not in the my-tasks payload yet (API_CONTRACT Gap 10), so always "garments", as designed. */
  unit: string;
  /** Completed pieces, or accepted pieces once the supervisor has reviewed. */
  achieved: number;
}

export interface TaskSubmission {
  photoUrl: string | null;
  note: string | null;
  submittedAt: string;
  completedQuantity: number;
  acceptedQuantity: number;
}

/**
 * The supervisor's review. The backend has no reject state (API_CONTRACT Gap 9): a review sets the
 * accepted quantity and notes, so `notes` is what the brief calls the rejection reason.
 */
export interface TaskReview {
  reviewedAt: string | null;
  notes: string | null;
  acceptedQuantity: number;
  completedQuantity: number;
}

/** The order line's garment snapshot. */
export interface TaskGarment {
  /** e.g. "Denim jacket". */
  description: string | null;
  color: string | null;
  /** e.g. "M, L, XL". */
  size: string | null;
  styleNumber: string | null;
}

/** What the task pays, in LKR: the order line's per-piece rate times each quantity. */
export interface TaskPayout {
  unitRate: number;
  /** target × rate. */
  estimated: number;
  /** completed × rate: what the submitted work earns if all of it is accepted. */
  completed: number;
  /** accepted × rate: what the reviewed work earned. */
  accepted: number;
}

/** A daily assignment as the app uses it (mapped from the my-tasks DTO in data/taskMapper.ts). */
export interface Task {
  /** The assignment id. */
  id: string;
  /** The work in one line, as the designs title it: "Mending · 120 garments". */
  title: string;
  garment: TaskGarment;
  status: TaskStatus;
  /** The working day the task belongs to. */
  dueDate: CalendarDate;
  target: TaskTarget;
  latestSubmission: TaskSubmission | null;
  review: TaskReview | null;
  /** The assigner's note. The backend keeps it in the worker-note column (API_CONTRACT Gap 18). */
  instructions: string | null;
  serviceName: string | null;
  orderNumber: string | null;
  customerName: string | null;
  location: string | null;
  acceptedAt: string | null;
  payout: TaskPayout;
  /** The employee's reason when they declined the task (status REJECTED). */
  rejectionReason: string | null;
}

/** What the accept endpoint confirms. */
export interface AcceptedTask {
  id: string;
  status: TaskStatus;
  acceptedAt: string | null;
}
