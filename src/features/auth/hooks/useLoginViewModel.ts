import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, type Control } from 'react-hook-form';

import { toApiError } from '@/shared/api/apiError';
import { features } from '@/shared/config/features';

import { loginFormSchema, type LoginFormValues } from '../data/loginForm';
import { signIn } from '../services/session';
import type { LoginNotice, SignOutReason } from '../types';

import { useSignOutReason } from './useSession';

const SESSION_ENDED_MESSAGE = 'Your session has ended. Please sign in again.';
const NOTICE_MESSAGES: Record<LoginNotice, string> = {
  passwordChanged: 'Password changed. Sign in with your new password.',
};
const LOGIN_FIELDS: readonly string[] = ['phone', 'password'] satisfies (keyof LoginFormValues)[];

function isLoginField(field: string): field is keyof LoginFormValues {
  return LOGIN_FIELDS.includes(field);
}

function isLoginNotice(value: string | undefined): value is LoginNotice {
  return value !== undefined && Object.hasOwn(NOTICE_MESSAGES, value);
}

/** The blue notice: a finished password reset (route param) wins over an expired session. */
function noticeFor(notice: string | undefined, signOutReason: SignOutReason | null): string | null {
  if (isLoginNotice(notice)) return NOTICE_MESSAGES[notice];
  return signOutReason === 'expired' ? SESSION_ENDED_MESSAGE : null;
}

export interface LoginViewModel {
  control: Control<LoginFormValues>;
  /** Validates the form and signs in. Ignored while a sign-in is running. */
  submit: () => void;
  focusPassword: () => void;
  /** Opens the password reset with the typed number; null hides the link (no backend flow yet). */
  openForgotPassword: (() => void) | null;
  isSubmitting: boolean;
  /** Server or network error for the red alert (E 1.2, E 1.3). Field errors show on the fields instead. */
  errorMessage: string | null;
  /** Explains why the sign-in screen opened: a password reset, or a session that ended on its own. */
  noticeMessage: string | null;
}

/** Sign-in screen state. A successful sign-in flips the session, and the root guard opens the app. */
export function useLoginViewModel(): LoginViewModel {
  const signOutReason = useSignOutReason();
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const { control, handleSubmit, setError, setFocus, getValues, resetField } =
    useForm<LoginFormValues>({
      resolver: zodResolver(loginFormSchema),
      defaultValues: { phone: '', password: '' },
    });

  const login = useMutation({
    mutationFn: signIn,
    // Fail fast with the offline message instead of waiting for the network to come back.
    networkMode: 'always',
    onError: (error) => {
      for (const [field, message] of Object.entries(toApiError(error).fieldErrors)) {
        if (isLoginField(field)) setError(field, { type: 'server', message });
      }
    },
  });

  const submitForm = handleSubmit((values) => {
    if (!login.isPending) login.mutate(values);
  });
  const error = login.error ? toApiError(login.error) : null;

  return {
    control,
    submit: () => {
      void submitForm();
    },
    focusPassword: () => {
      setFocus('password');
    },
    openForgotPassword: features.passwordReset
      ? () => {
          const phone = getValues('phone').trim();
          // A finished reset returns here; the failed attempt must not hide its notice.
          login.reset();
          resetField('password');
          router.push(
            phone ? { pathname: '/forgot-password', params: { phone } } : '/forgot-password',
          );
        }
      : null,
    isSubmitting: login.isPending,
    errorMessage: error && !error.hasFieldErrors ? error.message : null,
    noticeMessage: error ? null : noticeFor(notice, signOutReason),
  };
}
