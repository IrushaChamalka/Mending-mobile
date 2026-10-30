import { ApiError } from '@/shared/api/apiError';
import { endpoints } from '@/shared/api/endpoints';
import { parseResponse } from '@/shared/api/parseResponse';

import { authApi } from '../api';
import { canUseEmployeeApp, EMPLOYEES_ONLY_MESSAGE } from '../domain/employeeAccess';
import { toLoginIdentifier } from '../domain/loginIdentifier';
import type { LoginCredentials } from '../types';

import { mobileLoginResponseSchema, type MobileLoginRequestDto } from './dto';

export const authRepository = {
  /**
   * Exchanges sign-in credentials for an access token. Rejects with ApiError, including a
   * `forbidden` one for supervisor and admin accounts: the app is for employees only, and refusing
   * here means their token is never stored.
   */
  async login(credentials: LoginCredentials): Promise<string> {
    const request: MobileLoginRequestDto = {
      phone: toLoginIdentifier(credentials.phone),
      password: credentials.password,
    };
    const payload = await authApi.login(request);
    const response = parseResponse(mobileLoginResponseSchema, payload, endpoints.auth.mobileLogin);
    if (!canUseEmployeeApp(response.user.role)) {
      throw new ApiError({
        type: 'forbidden',
        message: EMPLOYEES_ONLY_MESSAGE,
        endpoint: endpoints.auth.mobileLogin,
        method: 'POST',
        retryable: false,
      });
    }
    return response.accessToken;
  },
};
