import { endpoints } from '@/shared/api/endpoints';
import { httpClient } from '@/shared/api/httpClient';

import type { SubmitWorkRequestDto } from '../data/dto';

/** A file for React Native's FormData. */
export interface PhotoUpload {
  uri: string;
  name: string;
  type: string;
}

export interface SubmissionRequestOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

/** Raw submission calls. Each resolves to the response's `data` payload, which the data layer validates. */
export interface SubmissionApi {
  /** POST /api/v1/orders/daily-assignments/:id/signature, multipart field `file`. */
  uploadPhoto(
    taskId: string,
    photo: PhotoUpload,
    options?: SubmissionRequestOptions,
  ): Promise<unknown>;
  /** POST /api/v1/orders/daily-assignments/:id/submit-work */
  submitWork(
    taskId: string,
    body: SubmitWorkRequestDto,
    options?: Pick<SubmissionRequestOptions, 'signal'>,
  ): Promise<unknown>;
}

export const httpSubmissionApi: SubmissionApi = {
  uploadPhoto: (taskId, photo, options = {}) => {
    const form = new FormData();
    // React Native's FormData takes a { uri, name, type } descriptor; the DOM typings only know Blob.
    form.append('file', photo as unknown as Blob);
    return httpClient.postMultipart(endpoints.submission.uploadPhoto(taskId), form, {
      signal: options.signal,
      onProgress: options.onProgress,
    });
  },
  submitWork: (taskId, body, options = {}) =>
    httpClient.post(endpoints.submission.submitWork(taskId), body, { signal: options.signal }),
};
