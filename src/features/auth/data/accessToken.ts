import { z } from 'zod';

import { decodeBase64Url } from '@/shared/utils/base64';

import { USER_ROLES, type SessionUser } from '../types';

/** Claims signed by AuthService.generateToken on the backend (API_CONTRACT §3.2). */
const accessTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(USER_ROLES),
  userId: z.string().nullish(),
  adminId: z.string().nullish(),
  phone: z.string().nullish(),
  exp: z.number().optional(),
});

export type AccessTokenClaimsDto = z.infer<typeof accessTokenClaimsSchema>;

/**
 * Reads the JWT payload without verifying the signature (the server does that). Returns null for
 * anything that is not a well-formed token with the expected claims.
 */
export function decodeAccessToken(token: string): AccessTokenClaimsDto | null {
  const segments = token.split('.');
  const payload = segments.length === 3 ? segments[1] : undefined;
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(decodeBase64Url(payload));
    const result = accessTokenClaimsSchema.safeParse(claims);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function toSessionUser(claims: AccessTokenClaimsDto): SessionUser {
  return {
    id: claims.sub,
    employeeId: claims.userId ?? claims.adminId ?? null,
    role: claims.role,
    phone: claims.phone ?? null,
  };
}
