import { z } from 'zod';

import type { FieldErrorMap } from '@/shared/api/apiError';

/** Body of POST /api/v1/auth/mobile/login (backend MobileLoginDto). */
export interface MobileLoginRequestDto {
  /** Mobile number, employee ID (userId) or email. */
  phone: string;
  password: string;
}

/**
 * `user` in the login response: the account row without its password (API_CONTRACT §3.1). The app
 * reads identity from the token instead, so only `id` is required here; the rest documents the shape.
 */
const loginUserSchema = z.object({
  id: z.string().min(1),
  /** EMPLOYEE | SUPERVISOR | ADMIN | SUPERADMIN */
  role: z.string(),
  /** STAFF for users, ADMIN for admin accounts. */
  userType: z.string().optional(),
  userId: z.string().nullish(),
  adminId: z.string().nullish(),
  name: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  imageUrl: z.string().nullish(),
  age: z.number().nullish(),
  nic: z.string().nullish(),
  gender: z.string().nullish(),
  isActive: z.boolean().optional(),
  createdById: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** `data` of the mobile login response. */
export const mobileLoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  /** Always "Bearer". */
  tokenType: z.string().optional(),
  /** The JWT lifetime, e.g. "7d". */
  expiresIn: z.string().optional(),
  user: loginUserSchema,
});

export type LoginUserDto = z.infer<typeof loginUserSchema>;
export type MobileLoginResponseDto = z.infer<typeof mobileLoginResponseSchema>;

/** Backend validation-message prefixes (MobileLoginDto) mapped to the sign-in form fields. */
export const loginFieldErrorMap: FieldErrorMap = {
  'Mobile number': 'phone',
  Password: 'password',
};

/*
 * Password reset (E 1.4–1.6). PROPOSED endpoints: the backend has no reset flow yet (API_CONTRACT §9),
 * so only the mock answers them and `features.passwordReset` hides the screens against the real server.
 */

/** Body of POST /api/v1/auth/mobile/password-reset/request: texts a code to this number. */
export interface PasswordResetRequestDto {
  /** International mobile number, e.g. "+94771234567". */
  phone: string;
}

/** `data` of the code request. */
export const passwordResetRequestResponseSchema = z.object({
  /** When the app may ask for another code. */
  resendAfterSeconds: z.number().int().nonnegative(),
  /** How long the texted code stays valid. */
  expiresInSeconds: z.number().int().positive(),
});

/** Body of POST /api/v1/auth/mobile/password-reset/verify. */
export interface PasswordResetVerifyRequestDto {
  phone: string;
  /** The six digits from the SMS. */
  code: string;
}

/** `data` of the code check: a short-lived token that allows one password change. */
export const passwordResetVerifyResponseSchema = z.object({
  resetToken: z.string().min(1),
});

/** Body of POST /api/v1/auth/mobile/password-reset/complete. */
export interface PasswordResetCompleteRequestDto {
  resetToken: string;
  /** Same rule as the login: at least 6 characters. */
  newPassword: string;
}

/**
 * `data` of the reset: a confirmation message only. The user signs in again with the new password.
 * Null is accepted too: the backend's ResponseInterceptor moves a lone `message` into the envelope
 * and sends `data: null`.
 */
export const passwordResetCompleteResponseSchema = z
  .object({ message: z.string().optional() })
  .nullable();

export type PasswordResetRequestResponseDto = z.infer<typeof passwordResetRequestResponseSchema>;
export type PasswordResetVerifyResponseDto = z.infer<typeof passwordResetVerifyResponseSchema>;
export type PasswordResetCompleteResponseDto = z.infer<typeof passwordResetCompleteResponseSchema>;

/** Proposed validation-message prefixes of the reset DTOs mapped to the reset form fields. */
export const passwordResetFieldErrorMap: FieldErrorMap = {
  'Mobile number': 'phone',
  Code: 'code',
  'New password': 'newPassword',
};
