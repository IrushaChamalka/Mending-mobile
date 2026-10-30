import { ApiError, isApiError } from '@/shared/api/apiError';
import { endpoints } from '@/shared/api/endpoints';
import { parseResponse } from '@/shared/api/parseResponse';

import { passwordResetApi } from '../api';
import { toLoginIdentifier } from '../domain/loginIdentifier';
import type { PasswordResetChallenge } from '../types';

import {
  passwordResetCompleteResponseSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifyResponseSchema,
  type PasswordResetRequestDto,
} from './dto';

const NO_ACCOUNT_MESSAGE = 'No account uses this mobile number.';

/** A 404 here means the number, not "that item" (the generic notFound copy). */
function explainNotFound(error: unknown): unknown {
  if (!isApiError(error) || error.type !== 'notFound') return error;
  return new ApiError({
    type: error.type,
    message: NO_ACCOUNT_MESSAGE,
    status: error.status,
    serverMessages: error.serverMessages,
    endpoint: error.endpoint,
    method: error.method,
    retryable: false,
    cause: error,
  });
}

/** Forgot password → code by SMS → new password (E 1.4–1.6), against the PROPOSED endpoints. */
export const passwordResetRepository = {
  /**
   * Texts a reset code. `phone` is what follows the +94 prefix and is normalised like the login's;
   * the result carries the normalised number for the next steps. Rejects with ApiError.
   */
  async requestCode(phone: string): Promise<PasswordResetChallenge> {
    const request: PasswordResetRequestDto = { phone: toLoginIdentifier(phone) };
    let payload: unknown;
    try {
      payload = await passwordResetApi.requestCode(request);
    } catch (error) {
      throw explainNotFound(error);
    }
    const response = parseResponse(
      passwordResetRequestResponseSchema,
      payload,
      endpoints.proposed.passwordResetRequest,
    );
    return { phone: request.phone, ...response };
  },

  /** Checks the texted code and resolves to the token that allows one password change. */
  async verifyCode(phone: string, code: string): Promise<string> {
    let payload: unknown;
    try {
      payload = await passwordResetApi.verifyCode({ phone: toLoginIdentifier(phone), code });
    } catch (error) {
      throw explainNotFound(error);
    }
    return parseResponse(
      passwordResetVerifyResponseSchema,
      payload,
      endpoints.proposed.passwordResetVerify,
    ).resetToken;
  },

  /** Sets the new password. Field errors land on `newPassword`. Does not sign in. */
  async completeReset(resetToken: string, newPassword: string): Promise<void> {
    const payload = await passwordResetApi.completeReset({ resetToken, newPassword });
    parseResponse(
      passwordResetCompleteResponseSchema,
      payload,
      endpoints.proposed.passwordResetComplete,
    );
  },
};
