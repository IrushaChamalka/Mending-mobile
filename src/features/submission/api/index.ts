import { env } from '@/shared/config/env';

import { mockSubmissionApi } from './mockSubmissionApi';
import { httpSubmissionApi, type SubmissionApi } from './submissionApi';

export type { PhotoUpload, SubmissionApi, SubmissionRequestOptions } from './submissionApi';

/** The real or the mock implementation, chosen once by EXPO_PUBLIC_USE_MOCK_API. */
export const submissionApi: SubmissionApi = env.useMockApi ? mockSubmissionApi : httpSubmissionApi;
