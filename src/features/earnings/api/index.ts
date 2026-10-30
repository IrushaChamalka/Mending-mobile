import { env } from '@/shared/config/env';

import { httpEarningsApi, type EarningsApi } from './earningsApi';
import { mockEarningsApi } from './mockEarningsApi';

export type { EarningsApi } from './earningsApi';

/** The real or the mock implementation, chosen once by EXPO_PUBLIC_USE_MOCK_API. */
export const earningsApi: EarningsApi = env.useMockApi ? mockEarningsApi : httpEarningsApi;
