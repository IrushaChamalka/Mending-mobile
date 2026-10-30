import { env } from '@/shared/config/env';

import { mockWithdrawalsApi } from './mockWithdrawalsApi';
import { httpWithdrawalsApi, type WithdrawalsApi } from './withdrawalsApi';

export type { WithdrawalsApi } from './withdrawalsApi';

/** The real or the mock implementation, chosen once by EXPO_PUBLIC_USE_MOCK_API. */
export const withdrawalsApi: WithdrawalsApi = env.useMockApi
  ? mockWithdrawalsApi
  : httpWithdrawalsApi;
