import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useForm, useWatch, type Control } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { useSyncPill, type SyncPillState } from '@/features/submission';
import { toApiError } from '@/shared/api/apiError';
import { logger } from '@/shared/lib/logger';
import { getPasswordStrength, type PasswordStrength } from '@/shared/utils/passwordStrength';

import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '../data/changePasswordForm';
import { profileRepository } from '../data/profileRepository';

export interface ChangePasswordViewModel {
  control: Control<ChangePasswordFormValues>;
  /** For the meter under the new password; null while it is empty. */
  strength: PasswordStrength | null;
  /** Validates both fields and saves. Ignored while a save is running. */
  submit: () => void;
  focusConfirm: () => void;
  isSubmitting: boolean;
  /** Offline, session ended, server error… Field errors show on the fields instead. */
  errorMessage: string | null;
  syncPill: SyncPillState;
  openSyncCenter: () => void;
  goBack: () => void;
}

function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/profile');
}

/**
 * Change password from the profile, against the real backend (PATCH /employee/profile with only
 * `password`). The session stays signed in; success shows a toast and returns to the profile.
 */
export function useChangePasswordViewModel(): ChangePasswordViewModel {
  const syncPill = useSyncPill();
  const { control, handleSubmit, setError, setFocus } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const save = useMutation({
    mutationFn: (values: ChangePasswordFormValues) =>
      profileRepository.changePassword(values.newPassword),
    // Fail fast with the offline message: a password change is not queued for later.
    networkMode: 'always',
    onSuccess: () => {
      logger.breadcrumb('password_changed');
      Toast.show({ type: 'success', text1: 'Password changed.' });
      goBack();
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
    syncPill,
    openSyncCenter: () => {
      router.push('/sync');
    },
    goBack,
  };
}
