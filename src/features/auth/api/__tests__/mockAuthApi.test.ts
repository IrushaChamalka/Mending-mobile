import { decodeAccessToken } from '../../data/accessToken';
import { mobileLoginResponseSchema } from '../../data/dto';
import { settleWithTimers as afterDelay } from '@/test-utils/timers';

import { findMockAccountByPhone, mockAuthApi } from '../mockAuthApi';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('mockAuthApi.login', () => {
  it('returns the backend DTO shape with a token the session can read', async () => {
    const payload = await afterDelay(
      mockAuthApi.login({ phone: '+94771234567', password: 'secret1' }),
    );
    const response = mobileLoginResponseSchema.parse(payload);
    expect(decodeAccessToken(response.accessToken)).toMatchObject({
      role: 'EMPLOYEE',
      userId: 'user00006',
      phone: '+94771234567',
    });
    expect(response.user).toMatchObject({ name: 'Kasun Fernando', userType: 'STAFF' });
  });

  it.each(['0771234567', '771234567', 'user00006'])(
    'matches %p like the backend does',
    async (phone) => {
      await expect(
        afterDelay(mockAuthApi.login({ phone, password: 'secret1' })),
      ).resolves.toBeTruthy();
    },
  );

  it('rejects unknown numbers with the design copy', async () => {
    await expect(
      afterDelay(mockAuthApi.login({ phone: '+94700000000', password: 'secret1' })),
    ).rejects.toMatchObject({
      type: 'unauthorized',
      message: 'Incorrect mobile number or password.',
    });
  });

  it('rejects the inactive account with the design copy', async () => {
    await expect(
      afterDelay(mockAuthApi.login({ phone: '+94712345673', password: 'secret1' })),
    ).rejects.toMatchObject({
      type: 'unauthorized',
      message: 'Your account is inactive. Please contact your supervisor.',
    });
  });

  it('fails short passwords like the backend validation pipe, mapped to the field', async () => {
    await expect(
      afterDelay(mockAuthApi.login({ phone: '+94771234567', password: '123' })),
    ).rejects.toMatchObject({
      type: 'validation',
      fieldErrors: { password: 'Password must be at least 6 characters' },
    });
  });
});

describe('mock accounts', () => {
  it('signs the seed supervisor in like the backend does (the app refuses the role)', async () => {
    const payload = await afterDelay(
      mockAuthApi.login({ phone: '+9876543210', password: 'secret1' }),
    );
    expect(mobileLoginResponseSchema.parse(payload).user).toMatchObject({ role: 'SUPERVISOR' });
  });

  it.each(['+94771234567', '0771234567', '771234567'])(
    'finds the account for %p by number only',
    (phone) => {
      expect(findMockAccountByPhone(phone)?.userId).toBe('user00006');
    },
  );

  it('does not treat an employee ID as a number', () => {
    expect(findMockAccountByPhone('user00006')).toBeUndefined();
  });
});
