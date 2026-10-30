import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { toApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';
import { formatPhoneNumber } from '@/shared/utils/phone';

import { passwordResetRepository } from '../data/passwordResetRepository';
import {
  formatCountdown,
  isCompleteVerificationCode,
  parseResendAfterSeconds,
  toVerificationCode,
  VERIFICATION_CODE_LENGTH,
} from '../domain/verificationCode';

import { useCountdown } from './useCountdown';

export interface VerifyCodeViewModel {
  /** Opened without a number (a stale link) or with the reset turned off: the screen starts over. */
  mustRestart: boolean;
  /** The number the code went to, as the design shows it: "+94 77 123 4567". */
  phoneLabel: string;
  code: string;
  codeLength: number;
  /** Keeps only digits, and hides the previous wrong-code alert. */
  setCode: (value: string) => void;
  /** Six digits typed and nothing running. */
  canVerify: boolean;
  verify: () => void;
  isVerifying: boolean;
  /** The server rejected the code: the boxes turn red. */
  isCodeRejected: boolean;
  /** "00:42" while a new code must wait; null once "Resend code" is offered. */
  resendCountdown: string | null;
  resend: () => void;
  isResending: boolean;
  errorMessage: string | null;
  goBack: () => void;
}

/**
 * Code check (E 1.5). The resend countdown starts from the code request's `resendAfterSeconds`
 * (route param `resendAfter`, 60 s when missing). A correct code moves on to the new-password step.
 */
export function useVerifyCodeViewModel(): VerifyCodeViewModel {
  const params = useLocalSearchParams<{ phone?: string; resendAfter?: string }>();
  const phone = params.phone ?? '';
  const [code, setCodeState] = useState('');
  const countdown = useCountdown(parseResendAfterSeconds(params.resendAfter));

  const verification = useMutation({
    mutationFn: (typed: string) => passwordResetRepository.verifyCode(phone, typed),
    networkMode: 'always',
    onSuccess: (resetToken) => {
      router.push({ pathname: '/new-password', params: { resetToken } });
    },
  });

  const resending = useMutation({
    mutationFn: () => passwordResetRepository.requestCode(phone),
    networkMode: 'always',
    onSuccess: (challenge) => {
      verification.reset();
      setCodeState('');
      countdown.restart(challenge.resendAfterSeconds);
    },
  });

  const failure = verification.error ?? resending.error;
  const error = failure ? toApiError(failure) : null;
  const canVerify =
    isCompleteVerificationCode(code) && !verification.isPending && !resending.isPending;

  return {
    mustRestart: !features.passwordReset || phone.length === 0,
    phoneLabel: formatPhoneNumber(phone),
    code,
    codeLength: VERIFICATION_CODE_LENGTH,
    setCode: (value) => {
      setCodeState(toVerificationCode(value));
      if (verification.error) verification.reset();
      if (resending.error) resending.reset();
    },
    canVerify,
    verify: () => {
      if (canVerify) verification.mutate(code);
    },
    isVerifying: verification.isPending,
    isCodeRejected: verification.error
      ? toApiError(verification.error).type === 'validation'
      : false,
    resendCountdown: countdown.secondsLeft > 0 ? formatCountdown(countdown.secondsLeft) : null,
    resend: () => {
      if (countdown.secondsLeft === 0 && !resending.isPending) resending.mutate();
    },
    isResending: resending.isPending,
    errorMessage: error?.message ?? null,
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/forgot-password');
    },
  };
}
