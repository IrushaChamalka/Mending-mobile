import { env } from '@/shared/config/env';

import { httpAuthApi, type AuthApi } from './authApi';
import { mockAuthApi } from './mockAuthApi';
import { mockPasswordResetApi } from './mockPasswordResetApi';
import { httpPasswordResetApi, type PasswordResetApi } from './passwordResetApi';

export type { AuthApi } from './authApi';
export type { PasswordResetApi } from './passwordResetApi';

/** The real or the mock implementation, chosen once by EXPO_PUBLIC_USE_MOCK_API. */
export const authApi: AuthApi = env.useMockApi ? mockAuthApi : httpAuthApi;

/**
 * Same choice for the proposed reset endpoints. Against the real backend the screens that call them
 * are hidden (`features.passwordReset`), so the http implementation is not reached yet.
 */
export const passwordResetApi: PasswordResetApi = env.useMockApi
  ? mockPasswordResetApi
  : httpPasswordResetApi;
