import { router } from 'expo-router';
import { useState } from 'react';

import { endSession, useSessionUser } from '@/features/auth';
import {
  discardUploadsOf,
  useSyncPill,
  useUploadSummary,
  type SyncPillState,
} from '@/features/submission';
import { usePendingAcceptCount } from '@/features/tasks';
import { appInfo } from '@/shared/config/appInfo';
import { features } from '@/shared/config/features';
import { formatPhoneNumber } from '@/shared/utils/phone';

import { roleLabel, signOutWarning } from '../domain/profileRules';

import { useProfileQuery } from './useProfileQuery';

const NOT_AVAILABLE = 'Not available';
const NOT_SET = 'Not set';
const SIGN_OUT_NOW_SAFE = 'Everything has reached the server now. You can sign out safely.';

export interface ProfileViewModel {
  name: string;
  roleLabel: string;
  imageUrl: string | null;
  employeeId: string;
  phone: string;
  age: string;
  gender: string;
  /** "StitchFlow 1.0.0", under the sign-out button. */
  appVersion: string;
  /** The payout account row (no backend endpoint yet: mock only). */
  showPayoutAccount: boolean;
  syncPill: SyncPillState;
  /** The confirmation is open: unsent work would be deleted by signing out. */
  isConfirmingSignOut: boolean;
  signOutMessage: string;
  isSigningOut: boolean;
  openSyncCenter: () => void;
  openPayoutAccount: () => void;
  openChangePassword: () => void;
  /** Signs out at once, or first asks when unsent work would be lost (brief §13). */
  signOut: () => void;
  confirmSignOut: () => void;
  cancelSignOut: () => void;
}

/**
 * Profile (E 6.1): who is signed in, payout account, change password and sign-out. Signing out
 * discards the user's own queued submissions, then ends the session, which deletes the token and
 * clears the query cache in memory and on disk.
 */
export function useProfileViewModel(): ProfileViewModel {
  const user = useSessionUser();
  const profile = useProfileQuery().data ?? null;
  const summary = useUploadSummary();
  const syncPill = useSyncPill();
  const pendingAccepts = usePendingAcceptCount();
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const warning = signOutWarning({
    submissions: summary.pendingCount + summary.failedCount,
    accepts: pendingAccepts,
  });

  const finishSignOut = async (): Promise<void> => {
    setIsConfirmingSignOut(false);
    setIsSigningOut(true);
    if (user) discardUploadsOf(user.id);
    await endSession('signedOut');
  };

  const phone = profile?.phone ?? user?.phone ?? null;
  const employeeId = profile?.employeeId ?? user?.employeeId ?? null;

  return {
    name: profile?.name ?? employeeId ?? 'Your profile',
    roleLabel: user ? roleLabel(user.role) : '',
    imageUrl: profile?.imageUrl ?? null,
    employeeId: employeeId ?? NOT_AVAILABLE,
    phone: phone ? formatPhoneNumber(phone) : NOT_AVAILABLE,
    age: profile?.age ? String(profile.age) : NOT_SET,
    gender: profile?.gender ?? NOT_SET,
    appVersion: `${appInfo.name} ${appInfo.version}`,
    showPayoutAccount: features.payoutAccount,
    syncPill,
    isConfirmingSignOut,
    signOutMessage: warning ?? SIGN_OUT_NOW_SAFE,
    isSigningOut,
    openSyncCenter: () => {
      router.push('/sync');
    },
    openPayoutAccount: () => {
      router.push('/profile/payout-account');
    },
    openChangePassword: () => {
      router.push('/profile/change-password');
    },
    signOut: () => {
      if (isSigningOut) return;
      if (warning) setIsConfirmingSignOut(true);
      else void finishSignOut();
    },
    confirmSignOut: () => {
      if (!isSigningOut) void finishSignOut();
    },
    cancelSignOut: () => {
      setIsConfirmingSignOut(false);
    },
  };
}
