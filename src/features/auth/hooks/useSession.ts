import { useSessionStore } from '../store/sessionStore';
import type { AuthStatus, SessionUser, SignOutReason } from '../types';

export function useAuthStatus(): AuthStatus {
  return useSessionStore((state) => state.status);
}

export function useSessionUser(): SessionUser | null {
  return useSessionStore((state) => state.user);
}

export function useSignOutReason(): SignOutReason | null {
  return useSessionStore((state) => state.signOutReason);
}
