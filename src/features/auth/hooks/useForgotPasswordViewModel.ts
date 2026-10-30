import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, type Control } from 'react-hook-form';

import { toApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';

import { passwordResetRepository } from '../data/passwordResetRepository';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from '../data/passwordResetForm';

export interface ForgotPasswordViewModel {
  /** False against the real backend, which has no reset endpoints yet: the screen returns to sign-in. */
  isAvailable: boolean;
  control: Control<ForgotPasswordFormValues>;
  /** Validates the number and asks for a code. Ignored while a request is running. */
  submit: () => void;
  isSubmitting: boolean;
  /** Unknown number, inactive account, offline… Field errors show on the field instead. */
  errorMessage: string | null;
  goBack: () => void;
}

/**
 * Forgot password (E 1.4). Opens with the number typed on the sign-in screen and, once a code is
 * texted, moves on to the code screen with the normalised number.
 */
export function useForgotPasswordViewModel(): ForgotPasswordViewModel {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const { control, handleSubmit, setError } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { phone: phone ?? '' },
  });

  const request = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      passwordResetRepository.requestCode(values.phone),
    // Fail fast with the offline message instead of waiting for the network to come back.
    networkMode: 'always',
    onSuccess: (challenge) => {
      router.push({
        pathname: '/verify-code',
        params: { phone: challenge.phone, resendAfter: String(challenge.resendAfterSeconds) },
      });
    },
    onError: (error) => {
      const message = toApiError(error).fieldErrors.phone;
      if (message) setError('phone', { type: 'server', message });
    },
  });

  const submitForm = handleSubmit((values) => {
    if (!request.isPending) request.mutate(values);
  });
  const error = request.error ? toApiError(request.error) : null;

  return {
    isAvailable: features.passwordReset,
    control,
    submit: () => {
      void submitForm();
    },
    isSubmitting: request.isPending,
    errorMessage: error && !error.hasFieldErrors ? error.message : null,
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/login');
    },
  };
}
