import { create } from 'zustand';

import type { AuthStatus, SessionUser, SignOutReason } from '../types';

interface SessionState {
  status: AuthStatus;
  user: SessionUser | null;
  /** Why the last session ended, so the login screen can explain an expired session. */
  signOutReason: SignOutReason | null;
}

interface SessionActions {
  setSignedIn(user: SessionUser): void;
  setSignedOut(reason: SignOutReason | null): void;
}

/**
 * Client-side session state. Not persisted: it is rebuilt from the keychain token at startup, and the
 * token itself never enters this store. Read it through the hooks in hooks/useSession.ts.
 */
export const useSessionStore = create<SessionState & SessionActions>()((set) => ({
  status: 'restoring',
  user: null,
  signOutReason: null,
  setSignedIn: (user) => {
    set({ status: 'signedIn', user, signOutReason: null });
  },
  setSignedOut: (reason) => {
    set({ status: 'signedOut', user: null, signOutReason: reason });
  },
}));
