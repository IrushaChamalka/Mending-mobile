/** Roles the backend signs into the access token. The app is built for EMPLOYEE. */
export const USER_ROLES = ['EMPLOYEE', 'SUPERVISOR', 'ADMIN', 'SUPERADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Who is signed in, decoded from the access token. Display details such as the name come from the profile query. */
export interface SessionUser {
  /** Backend uuid (JWT `sub`). */
  id: string;
  /** Human-readable employee ID such as "user00002" (JWT `userId`, or `adminId` for admin accounts). */
  employeeId: string | null;
  role: UserRole;
  phone: string | null;
}

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

/** Why the last session ended: the user signed out, the server rejected the token, or the saved token was unreadable. */
export type SignOutReason = 'signedOut' | 'expired' | 'invalid';

/** What the sign-in form collects. `phone` is what follows the +94 prefix, or an employee ID or email. */
export interface LoginCredentials {
  phone: string;
  password: string;
}

/** A reset code was texted (E 1.4 → E 1.5). */
export interface PasswordResetChallenge {
  /** The number it went to, as sent to the server ("+94771234567"). */
  phone: string;
  /** When another code may be requested. */
  resendAfterSeconds: number;
  /** How long this code stays valid. */
  expiresInSeconds: number;
}

/** A message the sign-in screen shows when it opens, passed as its `notice` route param. */
export type LoginNotice = 'passwordChanged';
