import { z } from 'zod';

import { PASSWORD_MIN_LENGTH } from '@/shared/utils/passwordStrength';

/**
 * Change password (E 1.6 form inside the app). Mirrors UpdateUserDto's `password` rule (at least 6
 * characters, API_CONTRACT §4) and asks for it twice. The backend does not ask for the current one.
 */
export const changePasswordFormSchema = z
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

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
