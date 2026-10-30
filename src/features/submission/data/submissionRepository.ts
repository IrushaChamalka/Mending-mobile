import { endpoints } from '@/shared/api/endpoints';
import { parseResponse } from '@/shared/api/parseResponse';

import { submissionApi } from '../api';

import {
  photoUploadResponseSchema,
  submitWorkResponseSchema,
  type SubmitWorkRequestDto,
} from './dto';

const PHOTO_FILE_NAME = 'tally-sheet.jpg';
const PHOTO_MIME_TYPE = 'image/jpeg';

export interface WorkSubmission {
  completedQuantity: number;
  acceptedQuantity: number | null;
  photoUrl: string;
  note: string | null;
}

export interface UploadPhotoOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

export const submissionRepository = {
  /** Step 1: uploads the photo file (multipart, field `file`) and resolves to its server URL. */
  async uploadPhoto(
    taskId: string,
    photoUri: string,
    options: UploadPhotoOptions = {},
  ): Promise<string> {
    const payload = await submissionApi.uploadPhoto(
      taskId,
      { uri: photoUri, name: PHOTO_FILE_NAME, type: PHOTO_MIME_TYPE },
      options,
    );
    const url = endpoints.submission.uploadPhoto(taskId);
    return parseResponse(photoUploadResponseSchema, payload, url).url;
  },

  /**
   * Step 2: records the work. The backend overwrites on repeat, so a retried call never duplicates.
   * Optional fields are left out rather than sent empty, because the backend keeps the stored value
   * of an omitted field (API_CONTRACT §6.2).
   */
  async submitWork(
    taskId: string,
    submission: WorkSubmission,
    options: { signal?: AbortSignal } = {},
  ): Promise<void> {
    const body: SubmitWorkRequestDto = {
      completedQuantity: submission.completedQuantity,
      customerSignatureUrl: submission.photoUrl,
    };
    if (submission.acceptedQuantity !== null) body.acceptedQuantity = submission.acceptedQuantity;
    if (submission.note !== null) body.workerNotes = submission.note;
    const payload = await submissionApi.submitWork(taskId, body, options);
    parseResponse(submitWorkResponseSchema, payload, endpoints.submission.submitWork(taskId));
  },
};
