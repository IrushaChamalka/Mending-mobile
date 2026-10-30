import {
  passwordResetCompleteResponseSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifyResponseSchema,
} from '../../data/dto';
import { settleWithTimers as afterDelay } from '@/test-utils/timers';

import { MOCK_RESET_CODE, mockPasswordResetApi } from '../mockPasswordResetApi';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('mockPasswordResetApi.requestCode', () => {
  it.each(['+94771234567', '0771234567', '771234567'])(
    'texts a code to %p and returns the proposed DTO',
    async (phone) => {
      const payload = await afterDelay(mockPasswordResetApi.requestCode({ phone }));
      expect(passwordResetRequestResponseSchema.parse(payload)).toEqual({
        resendAfterSeconds: 60,
        expiresInSeconds: 600,
      });
    },
  );

  it('rejects a number with no account', async () => {
    await expect(
      afterDelay(mockPasswordResetApi.requestCode({ phone: '+94700000000' })),
    ).rejects.toMatchObject({ type: 'notFound', status: 404 });
  });

  it('rejects the inactive account with the sign-in copy', async () => {
    await expect(
      afterDelay(mockPasswordResetApi.requestCode({ phone: '+94712345673' })),
    ).rejects.toMatchObject({
      type: 'forbidden',
      message: 'Your account is inactive. Please contact your supervisor.',
    });
  });

  it('fails an empty number like a validation pipe, mapped to the field', async () => {
    await expect(
      afterDelay(mockPasswordResetApi.requestCode({ phone: ' ' })),
    ).rejects.toMatchObject({
      type: 'validation',
      fieldErrors: { phone: 'Mobile number is required' },
    });
  });
});

describe('mockPasswordResetApi.verifyCode', () => {
  it('accepts 123456 and returns a reset token', async () => {
    const payload = await afterDelay(
      mockPasswordResetApi.verifyCode({ phone: '+94771234567', code: MOCK_RESET_CODE }),
    );
    expect(passwordResetVerifyResponseSchema.parse(payload).resetToken).toMatch(
      /^mock-reset-token\./,
    );
  });

  it('rejects any other code with the alert copy', async () => {
    await expect(
      afterDelay(mockPasswordResetApi.verifyCode({ phone: '+94771234567', code: '000000' })),
    ).rejects.toMatchObject({
      type: 'validation',
      message: 'That code is not right. Check the SMS and try again.',
      fieldErrors: {},
    });
  });
});

describe('mockPasswordResetApi.completeReset', () => {
  async function resetToken(): Promise<string> {
    const payload = await afterDelay(
      mockPasswordResetApi.verifyCode({ phone: '+94771234567', code: MOCK_RESET_CODE }),
    );
    return passwordResetVerifyResponseSchema.parse(payload).resetToken;
  }

  it('saves a password of 6 or more characters', async () => {
    const payload = await afterDelay(
      mockPasswordResetApi.completeReset({
        resetToken: await resetToken(),
        newPassword: 'Kasun@2026',
      }),
    );
    expect(passwordResetCompleteResponseSchema.parse(payload)).toEqual({
      message: 'Password updated successfully',
    });
  });

  it('maps a short password to the new-password field', async () => {
    await expect(
      afterDelay(
        mockPasswordResetApi.completeReset({ resetToken: await resetToken(), newPassword: '123' }),
      ),
    ).rejects.toMatchObject({
      type: 'validation',
      fieldErrors: { newPassword: 'New password must be at least 6 characters' },
    });
  });

  it('rejects a token it did not issue', async () => {
    await expect(
      afterDelay(
        mockPasswordResetApi.completeReset({ resetToken: 'forged', newPassword: 'secret1' }),
      ),
    ).rejects.toMatchObject({
      type: 'validation',
      message: 'Your reset code has expired. Ask for a new code.',
    });
  });
});
