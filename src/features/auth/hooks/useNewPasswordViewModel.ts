import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch, type Control } from 'react-hook-form';

import { toApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';
import { logger } from '@/shared/lib/logger';
import { getPasswordStrength, type PasswordStrength } from '@/shared/utils/passwordStrength';

import { newPasswordFormSchema, type NewPasswordFormValues } from '../data/passwordResetForm';
import { passwordResetRepository } from '../data/passwordResetRepository';
import type { LoginNotice } from '../types';

export interface NewPasswordViewModel {
  /** Opened without a reset token (a stale link) or with the reset turned off: the screen starts over. */
  mustRestart: boolean;
  control: Control<NewPasswordFormValues>;
  /** For the meter under the new password; null while it is empty. */
  strength: PasswordStrength | null;
  /** Validates both fields and saves. Ignored while a save is running. */
  submit: () => void;
  focusConfirm: () => void;
  isSubmitting: boolean;
  /** Expired reset, offline… Field errors show on the fields instead. */
  errorMessage: string | null;
  goBack: () => void;
}

const PASSWORD_CHANGED: LoginNotice = 'passwordChanged';

/**
 * New password (E 1.6). Saving ends the reset: every reset step leaves the stack and the sign-in
 * screen opens with a notice to use the new password. The user is not signed in automatically.
 */
export function useNewPasswordViewModel(): NewPasswordViewModel {
  const { resetToken } = useLocalSearchParams<{ resetToken?: string }>();
  const { control, handleSubmit, setError, setFocus } = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const save = useMutation({
    mutationFn: (values: NewPasswordFormValues) =>
      passwordResetRepository.completeReset(resetToken ?? '', values.newPassword),
    networkMode: 'always',
    onSuccess: () => {
      logger.breadcrumb('password_reset');
      router.dismissTo({ pathname: '/login', params: { notice: PASSWORD_CHANGED } });
    },
    onError: (error) => {
      const message = toApiError(error).fieldErrors.newPassword;
      if (message) setError('newPassword', { type: 'server', message });
    },
  });

  const submitForm = handleSubmit((values) => {
    if (!save.isPending) save.mutate(values);
  });
  const error = save.error ? toApiError(save.error) : null;

  return {
    mustRestart: !features.passwordReset || !resetToken,
    control,
    strength: getPasswordStrength(newPassword),
    submit: () => {
      void submitForm();
    },
    focusConfirm: () => {
      setFocus('confirmPassword');
    },
    isSubmitting: save.isPending,
    errorMessage: error && !error.hasFieldErrors ? error.message : null,
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/forgot-password');
    },
  };
}
