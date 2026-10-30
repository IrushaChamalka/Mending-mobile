import { endpoints } from '@/shared/api/endpoints';
import { httpClient } from '@/shared/api/httpClient';

import { loginFieldErrorMap, type MobileLoginRequestDto } from '../data/dto';

/** Raw auth calls. Each resolves to the response's `data` payload, which the data layer validates. */
export interface AuthApi {
  /** POST /api/v1/auth/mobile/login */
  login(request: MobileLoginRequestDto): Promise<unknown>;
}

export const httpAuthApi: AuthApi = {
  login: (request) =>
    httpClient.post(endpoints.auth.mobileLogin, request, {
      skipAuth: true,
      // The backend's 401 messages are the design's alert copy (M 1.2, M 1.3).
      useServerMessage: true,
      fieldErrorMap: loginFieldErrorMap,
    }),
};
