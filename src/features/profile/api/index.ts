import { env } from '@/shared/config/env';

import { mockProfileApi } from './mockProfileApi';
import { httpProfileApi, type ProfileApi } from './profileApi';

export type { ProfileApi } from './profileApi';

/** The real or the mock implementation, chosen once by EXPO_PUBLIC_USE_MOCK_API. */
export const profileApi: ProfileApi = env.useMockApi ? mockProfileApi : httpProfileApi;
