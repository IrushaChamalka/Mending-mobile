/** The backend's TaskAssignmentStatus enum (prisma/schema/orders.prisma, API_CONTRACT §5.1). */
export const TASK_STATUSES = [
  'ASSIGNED',
  'ACCEPTED',
  'REJECTED',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVIEWED',
  'CANCELLED',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
