import { ApiError } from '@/shared/api/apiError';
import { mockApiError } from '@/shared/api/mock';

import { passwordResetApi } from '../../api';
import { passwordResetRepository } from '../passwordResetRepository';

jest.mock('../../api', () => ({
  passwordResetApi: { requestCode: jest.fn(), verifyCode: jest.fn(), completeReset: jest.fn() },
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));

const requestCode = jest.mocked(passwordResetApi.requestCode);
const verifyCode = jest.mocked(passwordResetApi.verifyCode);
const completeReset = jest.mocked(passwordResetApi.completeReset);

const REQUEST = { method: 'POST', url: '/api/v1/auth/mobile/password-reset/request' };

describe('passwordResetRepository', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('requestCode', () => {
    it('sends the number like the sign-in does and returns it with the timings', async () => {
      requestCode.mockResolvedValue({ resendAfterSeconds: 42, expiresInSeconds: 600 });

      await expect(passwordResetRepository.requestCode('077 123 4567')).resolves.toEqual({
        phone: '+94771234567',
        resendAfterSeconds: 42,
        expiresInSeconds: 600,
      });
      expect(requestCode).toHaveBeenCalledWith({ phone: '+94771234567' });
    });

    it('explains a 404 as a number with no account', async () => {
      requestCode.mockRejectedValue(mockApiError(404, 'User not found', REQUEST));

      await expect(passwordResetRepository.requestCode('700000000')).rejects.toMatchObject({
        type: 'notFound',
        message: 'No account uses this mobile number.',
        isRetryable: false,
      });
    });

    it('passes other failures through unchanged', async () => {
      const offline = new ApiError({ type: 'network', message: 'Offline' });
      requestCode.mockRejectedValue(offline);

      await expect(passwordResetRepository.requestCode('771234567')).rejects.toBe(offline);
    });

    it('rejects a payload that breaks the proposed contract', async () => {
      requestCode.mockResolvedValue({ sent: true });

      await expect(passwordResetRepository.requestCode('771234567')).rejects.toMatchObject({
        type: 'server',
        isRetryable: false,
      });
    });
  });

  describe('verifyCode', () => {
    it('returns the reset token', async () => {
      verifyCode.mockResolvedValue({ resetToken: 'reset-token' });

      await expect(passwordResetRepository.verifyCode('+94771234567', '123456')).resolves.toBe(
        'reset-token',
      );
      expect(verifyCode).toHaveBeenCalledWith({ phone: '+94771234567', code: '123456' });
    });
  });

  describe('completeReset', () => {
    it('accepts the envelope with `data: null` the backend sends for a message-only reply', async () => {
      completeReset.mockResolvedValue(null);

      await expect(
        passwordResetRepository.completeReset('reset-token', 'Kasun@2026'),
      ).resolves.toBeUndefined();
    });

    it('sends the token and the new password', async () => {
      completeReset.mockResolvedValue({ message: 'Password updated successfully' });

      await expect(
        passwordResetRepository.completeReset('reset-token', 'Kasun@2026'),
      ).resolves.toBeUndefined();
      expect(completeReset).toHaveBeenCalledWith({
        resetToken: 'reset-token',
        newPassword: 'Kasun@2026',
      });
    });
  });
});
