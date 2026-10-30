import { z } from 'zod';

import { PASSWORD_MIN_LENGTH } from '@/shared/utils/passwordStrength';

import { isPhoneIdentifier, toLoginIdentifier } from '../domain/loginIdentifier';

/**
 * Forgot password (E 1.4). The number is read like the sign-in field, but it must be a number: the
 * code goes out by SMS, so an employee ID or email cannot receive it.
 */
export const forgotPasswordFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, { error: 'Enter your mobile number.' })
    .refine((value) => value.length === 0 || isPhoneIdentifier(toLoginIdentifier(value)), {
      error: 'Enter a valid mobile number.',
    }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

/** New password (E 1.6): the login's minimum length, typed twice. */
export const newPasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, { error: 'Enter a new password.' })
      .min(PASSWORD_MIN_LENGTH, {
        error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      }),
    confirmPassword: z.string().min(1, { error: 'Confirm your new password.' }),
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    error: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type NewPasswordFormValues = z.infer<typeof newPasswordFormSchema>;
