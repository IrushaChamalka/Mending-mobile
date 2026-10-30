import { z } from 'zod';

import type { FieldErrorMap } from '@/shared/api/apiError';

/**
 * `data` of GET /api/v1/employee/profile and /supervisor/profile (API_CONTRACT §4). Only the fields
 * the app shows are validated; the rest of the user record (NIC, createdBy…) is ignored.
 */
export const profileDtoSchema = z.object({
  id: z.string().min(1),
  userId: z.string().nullish(),
  name: z.string().nullish(),
  phone: z.string().nullish(),
  imageUrl: z.string().nullish(),
  age: z.number().nullish(),
  gender: z.string().nullish(),
  email: z.string().nullish(),
});

export type ProfileDto = z.infer<typeof profileDtoSchema>;

/** Body of PATCH /api/v1/employee/profile when only the password changes (backend UpdateUserDto). */
export interface ChangePasswordRequestDto {
  password: string;
}

/** `data` of PATCH /api/v1/employee/profile: a message and the updated user without its password. */
export const updateProfileResponseSchema = z.object({
  message: z.string().optional(),
  user: z.object({ id: z.string().min(1) }),
});

/** Backend validation-message prefixes (UpdateUserDto) mapped to the change-password form fields. */
export const changePasswordFieldErrorMap: FieldErrorMap = {
  password: 'newPassword',
};
