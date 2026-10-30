import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { JSX, ReactNode } from 'react';

import { mockApiError } from '@/shared/api/mock';

import { passwordResetRepository } from '../../data/passwordResetRepository';
import { useVerifyCodeViewModel } from '../useVerifyCodeViewModel';

const mockParams: { phone?: string; resendAfter?: string } = {};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/shared/config/features', () => ({ features: { passwordReset: true } }));
jest.mock('../../data/passwordResetRepository', () => ({
  passwordResetRepository: { requestCode: jest.fn(), verifyCode: jest.fn() },
}));

const requestCode = jest.mocked(passwordResetRepository.requestCode);
const verifyCode = jest.mocked(passwordResetRepository.verifyCode);

type Result = { current: ReturnType<typeof useVerifyCodeViewModel> };

async function renderViewModel(): Promise<Result> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { gcTime: Infinity } },
  });
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const { result } = await renderHook(() => useVerifyCodeViewModel(), { wrapper: Wrapper });
  return result;
}

/** Moves the clock and lets the countdown and any finished request update the hook. */
async function advance(ms: number): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe('useVerifyCodeViewModel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockParams.phone = '+94771234567';
    mockParams.resendAfter = '42';
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('shows where the code went and counts down from the request', async () => {
    const result = await renderViewModel();

    expect(result.current.mustRestart).toBe(false);
    expect(result.current.phoneLabel).toBe('+94 77 123 4567');
    expect(result.current.resendCountdown).toBe('00:42');

    await advance(1_000);
    expect(result.current.resendCountdown).toBe('00:41');

    await advance(41_000);
    expect(result.current.resendCountdown).toBeNull();
  });

  it('counts down from 60 seconds when the request did not say', async () => {
    mockParams.resendAfter = undefined;
    const result = await renderViewModel();

    expect(result.current.resendCountdown).toBe('01:00');
  });

  it('starts over when opened without a number', async () => {
    mockParams.phone = undefined;
    const result = await renderViewModel();

    expect(result.current.mustRestart).toBe(true);
  });

  it('offers a new code only after the countdown, then counts down again', async () => {
    requestCode.mockResolvedValue({
      phone: '+94771234567',
      resendAfterSeconds: 30,
      expiresInSeconds: 600,
    });
    const result = await renderViewModel();
    await act(async () => {
      result.current.setCode('482');
      result.current.resend();
    });
    expect(requestCode).not.toHaveBeenCalled();

    await advance(42_000);
    await act(async () => {
      result.current.resend();
    });
    await advance(0);

    expect(requestCode).toHaveBeenCalledWith('+94771234567');
    expect(result.current.resendCountdown).toBe('00:30');
    expect(result.current.code).toBe('');
  });

  it('keeps digits only and verifies six of them, then opens the new-password step', async () => {
    verifyCode.mockResolvedValue('reset-token');
    const result = await renderViewModel();

    await act(async () => {
      result.current.setCode('48 29');
    });
    expect(result.current.code).toBe('4829');
    expect(result.current.canVerify).toBe(false);

    await act(async () => {
      result.current.setCode('482913');
    });
    expect(result.current.canVerify).toBe(true);
    await act(async () => {
      result.current.verify();
    });
    await advance(0);

    expect(verifyCode).toHaveBeenCalledWith('+94771234567', '482913');
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/new-password',
      params: { resetToken: 'reset-token' },
    });
  });

  it('shows a wrong code in the alert and red boxes until the user types again', async () => {
    verifyCode.mockRejectedValue(
      mockApiError(
        400,
        'That code is not right. Check the SMS and try again.',
        { method: 'POST', url: '/api/v1/auth/mobile/password-reset/verify' },
        { useServerMessage: true },
      ),
    );
    const result = await renderViewModel();

    await act(async () => {
      result.current.setCode('000000');
    });
    await act(async () => {
      result.current.verify();
    });
    await advance(0);

    expect(result.current.errorMessage).toBe(
      'That code is not right. Check the SMS and try again.',
    );
    expect(result.current.isCodeRejected).toBe(true);
    expect(router.push).not.toHaveBeenCalled();

    await act(async () => {
      result.current.setCode('00000');
    });
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isCodeRejected).toBe(false);
  });
});
