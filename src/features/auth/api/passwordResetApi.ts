import { endpoints } from '@/shared/api/endpoints';
import { httpClient } from '@/shared/api/httpClient';

import {
  passwordResetFieldErrorMap,
  type PasswordResetCompleteRequestDto,
  type PasswordResetRequestDto,
  type PasswordResetVerifyRequestDto,
} from '../data/dto';

/**
 * Raw password-reset calls (PROPOSED endpoints, not on the backend yet). Each resolves to the
 * response's `data` payload, which the data layer validates.
 */
export interface PasswordResetApi {
  /** POST /api/v1/auth/mobile/password-reset/request */
  requestCode(request: PasswordResetRequestDto): Promise<unknown>;
  /** POST /api/v1/auth/mobile/password-reset/verify */
  verifyCode(request: PasswordResetVerifyRequestDto): Promise<unknown>;
  /** POST /api/v1/auth/mobile/password-reset/complete */
  completeReset(request: PasswordResetCompleteRequestDto): Promise<unknown>;
}

// Signed-out calls whose messages are written for people, like the login's.
const OPTIONS = {
  skipAuth: true,
  useServerMessage: true,
  fieldErrorMap: passwordResetFieldErrorMap,
};

export const httpPasswordResetApi: PasswordResetApi = {
  requestCode: (request) =>
    httpClient.post(endpoints.proposed.passwordResetRequest, request, OPTIONS),
  verifyCode: (request) =>
    httpClient.post(endpoints.proposed.passwordResetVerify, request, OPTIONS),
  completeReset: (request) =>
    httpClient.post(endpoints.proposed.passwordResetComplete, request, OPTIONS),
};
