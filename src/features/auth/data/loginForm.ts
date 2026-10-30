import { z } from 'zod';

/**
 * Sign-in form rules. They mirror the backend's MobileLoginDto (API_CONTRACT §7): the identifier is
 * required, the password is required and at least 6 characters. Messages are written for people.
 */
export const loginFormSchema = z.object({
  phone: z.string().trim().min(1, { error: 'Enter your mobile number.' }),
  password: z
    .string()
    .min(1, { error: 'Enter your password.' })
    .min(6, { error: 'Password must be at least 6 characters.' }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
