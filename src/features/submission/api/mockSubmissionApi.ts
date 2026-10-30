/** Mock submission api for EXPO_PUBLIC_USE_MOCK_API=true: simulated upload progress, then mock tasks update. */
import { recordMockSubmission } from '@/features/tasks';
import { apiErrorFromTransport } from '@/shared/api/apiError';
import { endpoints, toEndpointTemplate } from '@/shared/api/endpoints';
import { mockDelay } from '@/shared/api/mock';

import type { SubmissionApi } from './submissionApi';

const PROGRESS_STEPS = [0.2, 0.45, 0.7, 0.9, 1];
const PROGRESS_STEP_MS = 250;

function throwIfAborted(signal: AbortSignal | undefined, url: string): void {
  if (signal?.aborted) {
    throw apiErrorFromTransport('cancelled', {
      endpoint: toEndpointTemplate(url),
      method: 'POST',
    });
  }
}

export const mockSubmissionApi: SubmissionApi = {
  async uploadPhoto(taskId, _photo, options = {}) {
    const url = endpoints.submission.uploadPhoto(taskId);
    for (const fraction of PROGRESS_STEPS) {
      await mockDelay(PROGRESS_STEP_MS);
      throwIfAborted(options.signal, url);
      options.onProgress?.(fraction);
    }
    // The backend answers with the S3 URL; the mock tasks show a placeholder sheet instead.
    return { url: `https://mock.stitchflow.invalid/${taskId}/tally-sheet.jpg` };
  },
  async submitWork(taskId, body, options = {}) {
    await mockDelay();
    throwIfAborted(options.signal, endpoints.submission.submitWork(taskId));
    return recordMockSubmission(taskId, {
      completedQuantity: body.completedQuantity,
      acceptedQuantity: body.acceptedQuantity ?? null,
      note: body.workerNotes ?? null,
    });
  },
};
