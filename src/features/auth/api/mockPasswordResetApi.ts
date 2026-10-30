/**
 * Mock password-reset api for EXPO_PUBLIC_USE_MOCK_API=true. The endpoints are proposed (see
 * passwordResetApi.ts); this is the only thing that answers them. It knows the accounts of
 * mockAuthApi, and **the code is always 123456**.
 *
 * | Step          | Input (after +94)             | Result                                                            |
 * | ------------- | ----------------------------- | ----------------------------------------------------------------- |
 * | Send code     | 77 123 4567, 71 234 5671/5672 | code "texted"; resend allowed after 60 s                          |
 * | Send code     | 71 234 5673                   | 403 "Your account is inactive. Please contact your supervisor."   |
 * | Send code     | any other number              | 404 "No account uses this mobile number."                         |
 * | Verify code   | 123456                        | a reset token                                                     |
 * | Verify code   | anything else                 | 400 "That code is not right. Check the SMS and try again."        |
 * | Save password | 6 or more characters          | done                                                              |
 *
 * Nothing is stored: mock sign-in accepts any password of 6 or more characters anyway.
 */
import { endpoints } from '@/shared/api/endpoints';
import { mockApiError, mockDelay } from '@/shared/api/mock';
import { PASSWORD_MIN_LENGTH } from '@/shared/utils/passwordStrength';

import {
  passwordResetFieldErrorMap,
  type PasswordResetCompleteResponseDto,
  type PasswordResetRequestResponseDto,
  type PasswordResetVerifyResponseDto,
} from '../data/dto';

import { findMockAccountByPhone } from './mockAuthApi';
import type { PasswordResetApi } from './passwordResetApi';

/** The one code the mock accepts. */
export const MOCK_RESET_CODE = '123456';

const RESEND_AFTER_SECONDS = 60;
const EXPIRES_IN_SECONDS = 10 * 60;
const RESET_TOKEN_PREFIX = 'mock-reset-token.';
const ERROR_OPTIONS = { useServerMessage: true, fieldErrorMap: passwordResetFieldErrorMap };

const NO_ACCOUNT = 'No account uses this mobile number.';
const INACTIVE_ACCOUNT = 'Your account is inactive. Please contact your supervisor.';
const WRONG_CODE = 'That code is not right. Check the SMS and try again.';
const EXPIRED_RESET = 'Your reset code has expired. Ask for a new code.';

function failure(status: number, message: string | string[], url: string): Error {
  return mockApiError(status, message, { method: 'POST', url }, ERROR_OPTIONS);
}

export const mockPasswordResetApi: PasswordResetApi = {
  async requestCode(request): Promise<PasswordResetRequestResponseDto> {
    await mockDelay();
    const url = endpoints.proposed.passwordResetRequest;
    if (!request.phone.trim()) throw failure(400, ['Mobile number is required'], url);
    const account = findMockAccountByPhone(request.phone);
    if (!account) throw failure(404, NO_ACCOUNT, url);
    if (!account.isActive) throw failure(403, INACTIVE_ACCOUNT, url);
    return { resendAfterSeconds: RESEND_AFTER_SECONDS, expiresInSeconds: EXPIRES_IN_SECONDS };
  },

  async verifyCode(request): Promise<PasswordResetVerifyResponseDto> {
    await mockDelay();
    const url = endpoints.proposed.passwordResetVerify;
    const account = findMockAccountByPhone(request.phone);
    if (!account) throw failure(404, NO_ACCOUNT, url);
    if (request.code !== MOCK_RESET_CODE) throw failure(400, WRONG_CODE, url);
    return { resetToken: `${RESET_TOKEN_PREFIX}${account.id}` };
  },

  async completeReset(request): Promise<PasswordResetCompleteResponseDto> {
    await mockDelay();
    const url = endpoints.proposed.passwordResetComplete;
    if (!request.resetToken.startsWith(RESET_TOKEN_PREFIX)) throw failure(400, EXPIRED_RESET, url);
    if (request.newPassword.length < PASSWORD_MIN_LENGTH) {
      throw failure(400, [`New password must be at least ${PASSWORD_MIN_LENGTH} characters`], url);
    }
    return { message: 'Password updated successfully' };
  },
};
