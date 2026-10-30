import { z } from 'zod';

import { TASK_STATUSES } from '@/shared/api/taskStatus';

/** `data` of POST …/signature (API_CONTRACT §6.1). */
export const photoUploadResponseSchema = z.object({
  url: z.string().min(1),
});

/** Body of POST …/submit-work (backend SubmitDailyWorkDto). Unknown properties are rejected. */
export interface SubmitWorkRequestDto {
  completedQuantity: number;
  acceptedQuantity?: number;
  /** The URL from the photo upload. */
  customerSignatureUrl?: string;
  workerNotes?: string;
}

/** `data` of POST …/submit-work: the DailyAssignment entity; the app only checks it was recorded. */
export const submitWorkResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(TASK_STATUSES),
});
