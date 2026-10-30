import { ApiError } from '@/shared/api/apiError';
import { configureHttpAuth } from '@/shared/api/httpClient';
import { logger } from '@/shared/lib/logger';
import { clearQueryCache } from '@/shared/lib/queryClient';
import { deleteAccessToken, readAccessToken, writeAccessToken } from '@/shared/lib/secureStorage';
import { setSentryUser } from '@/shared/lib/sentry';

import { decodeAccessToken, toSessionUser } from '../data/accessToken';
import { authRepository } from '../data/authRepository';
import { useSessionStore } from '../store/sessionStore';
import type { LoginCredentials, SessionUser, SignOutReason } from '../types';

/**
 * In-memory copy of the access token, so requests never wait on the keychain. The keychain copy is
 * the only persisted one.
 */
let accessToken: string | null = null;
let initialization: Promise<void> | null = null;

function markSignedIn(user: SessionUser): void {
  useSessionStore.getState().setSignedIn(user);
  setSentryUser(user.employeeId ?? user.id);
}

/**
 * Restores the last session from the keychain. The app does not expire sessions by the device clock:
 * field phones often have a wrong clock, and waiting for the server's 401 keeps cached tasks and
 * queued submissions usable while offline (API_CONTRACT Gap 1).
 */
async function restoreSession(): Promise<void> {
  let token: string | null;
  try {
    token = await readAccessToken();
  } catch (error) {
    logger.warn('Could not read the saved session', { error });
    await deleteAccessToken().catch(() => undefined);
    useSessionStore.getState().setSignedOut('invalid');
    return;
  }

  const claims = token ? decodeAccessToken(token) : null;
  if (token && claims) {
    accessToken = token;
    markSignedIn(toSessionUser(claims));
    return;
  }
  if (token) {
    // Saved but unreadable: discard it rather than send a broken token.
    await deleteAccessToken().catch(() => undefined);
  }
  useSessionStore.getState().setSignedOut(token ? 'invalid' : null);
}

/**
 * Ends the session: forgets the token and all cached server data, which sends the user to sign-in.
 * The upload queue is not touched, so queued submissions upload after the same user signs in again.
 * An explicit sign-out with pending uploads is confirmed and cleared by the Profile screen first.
 */
export async function endSession(reason: SignOutReason): Promise<void> {
  const hadSession = accessToken !== null || useSessionStore.getState().status === 'signedIn';
  // First and synchronous: requests still in flight now see that the session is gone.
  accessToken = null;
  if (!hadSession) return;

  useSessionStore.getState().setSignedOut(reason);
  setSentryUser(null);
  logger.breadcrumb(reason === 'expired' ? 'session_expired' : 'logout');

  const results = await Promise.allSettled([deleteAccessToken(), clearQueryCache()]);
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.warn('Sign-out cleanup failed', { error: result.reason });
    }
  }
}

/** Starts a session with a token from the login endpoint. */
async function startSession(token: string): Promise<SessionUser> {
  const claims = decodeAccessToken(token);
  if (!claims) {
    throw new ApiError({
      type: 'server',
      message: 'Sign-in failed because the server sent an unreadable session. Please try again.',
      retryable: false,
    });
  }
  await writeAccessToken(token);
  accessToken = token;
  const user = toSessionUser(claims);
  markSignedIn(user);
  logger.breadcrumb('login', { role: user.role });
  return user;
}

/** Signs in with the form's credentials and starts the session. Rejects with ApiError. */
export async function signIn(credentials: LoginCredentials): Promise<SessionUser> {
  const token = await authRepository.login(credentials);
  return startSession(token);
}

/** Connects the HTTP client to the session and restores the last one. Runs once; later calls share the result. */
export function initializeSession(): Promise<void> {
  initialization ??= (async () => {
    configureHttpAuth({
      getAccessToken: () => accessToken,
      // The backend has no refresh endpoint yet (API_CONTRACT Gap 1), so a rejected token ends the session.
      refreshAccessToken: () => Promise.resolve(null),
      onSessionExpired: () => {
        void endSession('expired');
      },
    });
    await restoreSession();
  })();
  return initialization;
}

/** The signed-in user, for code outside React (the upload queue). */
export function getSessionUser(): SessionUser | null {
  return useSessionStore.getState().user;
}

/** Calls `listener` whenever the signed-in user changes (sign-in, sign-out). Returns the unsubscribe function. */
export function subscribeToSessionUser(listener: (user: SessionUser | null) => void): () => void {
  return useSessionStore.subscribe((state, previous) => {
    if (state.user !== previous.user) listener(state.user);
  });
}
