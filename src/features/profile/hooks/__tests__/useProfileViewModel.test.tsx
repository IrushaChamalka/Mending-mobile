import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { JSX, ReactNode } from 'react';

import { endSession, type SessionUser } from '@/features/auth';
import { discardUploadsOf, type UploadSummary } from '@/features/submission';

import { makeProfile } from '../../__fixtures__/profileFixtures';
import { profileRepository } from '../../data/profileRepository';
import { useProfileViewModel } from '../useProfileViewModel';

const USER: SessionUser = {
  id: 'user-1',
  employeeId: 'user00006',
  role: 'EMPLOYEE',
  phone: '+94771234567',
};

const mockState = {
  user: USER as SessionUser | null,
  summary: { pendingCount: 0, failedCount: 0, lastSyncedAt: null } as UploadSummary,
  pendingAccepts: 0,
};

jest.mock('@/features/auth', () => ({
  useSessionUser: () => mockState.user,
  endSession: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/features/submission', () => ({
  useUploadSummary: () => mockState.summary,
  useSyncPill: () => ({ status: 'synced', pendingCount: 0, failedCount: 0 }),
  discardUploadsOf: jest.fn(),
}));
jest.mock('@/features/tasks', () => ({ usePendingAcceptCount: () => mockState.pendingAccepts }));
jest.mock('@/shared/config/appInfo', () => ({ appInfo: { name: 'StitchFlow', version: '1.4.2' } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../data/profileRepository', () => ({
  profileRepository: { fetchProfile: jest.fn() },
}));

const fetchProfile = jest.mocked(profileRepository.fetchProfile);

async function renderViewModel(): Promise<{ current: ReturnType<typeof useProfileViewModel> }> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const { result } = await renderHook(() => useProfileViewModel(), { wrapper: Wrapper });
  return result;
}

describe('useProfileViewModel', () => {
  beforeEach(() => {
    mockState.user = USER;
    mockState.summary = { pendingCount: 0, failedCount: 0, lastSyncedAt: null };
    mockState.pendingAccepts = 0;
    fetchProfile.mockResolvedValue(makeProfile());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows who is signed in and the app version (E 6.1)', async () => {
    const result = await renderViewModel();

    await waitFor(() => {
      expect(result.current.name).toBe('Kasun Fernando');
    });
    expect(fetchProfile).toHaveBeenCalledWith('EMPLOYEE');
    expect(result.current).toMatchObject({
      roleLabel: 'Employee',
      employeeId: 'user00006',
      phone: '+94 77 123 4567',
      age: '28',
      gender: 'Male',
      appVersion: 'StitchFlow 1.4.2',
    });
  });

  it('shows the session details while the profile is still loading', async () => {
    fetchProfile.mockReturnValue(new Promise(() => undefined));
    const result = await renderViewModel();

    expect(result.current.name).toBe('user00006');
    expect(result.current.phone).toBe('+94 77 123 4567');
  });

  it('signs out at once when nothing would be lost', async () => {
    const result = await renderViewModel();

    await act(async () => {
      result.current.signOut();
    });

    expect(result.current.isConfirmingSignOut).toBe(false);
    expect(endSession).toHaveBeenCalledWith('signedOut');
  });

  it('asks first when submissions would be deleted, then discards them before ending the session', async () => {
    mockState.summary = { pendingCount: 1, failedCount: 1, lastSyncedAt: null };
    const result = await renderViewModel();

    await act(async () => {
      result.current.signOut();
    });

    expect(result.current.isConfirmingSignOut).toBe(true);
    expect(result.current.signOutMessage).toBe(
      "2 submissions haven't reached the server yet. Signing out now deletes them from this phone.",
    );
    expect(endSession).not.toHaveBeenCalled();

    await act(async () => {
      result.current.confirmSignOut();
    });

    expect(discardUploadsOf).toHaveBeenCalledWith('user-1');
    expect(endSession).toHaveBeenCalledWith('signedOut');
    const discardedAt = jest.mocked(discardUploadsOf).mock.invocationCallOrder[0] ?? Infinity;
    const endedAt = jest.mocked(endSession).mock.invocationCallOrder[0] ?? -Infinity;
    expect(discardedAt).toBeLessThan(endedAt);
  });

  it('keeps everything when the user decides to stay signed in', async () => {
    mockState.summary = { pendingCount: 1, failedCount: 0, lastSyncedAt: null };
    const result = await renderViewModel();

    await act(async () => {
      result.current.signOut();
    });
    await act(async () => {
      result.current.cancelSignOut();
    });

    expect(result.current.isConfirmingSignOut).toBe(false);
    expect(discardUploadsOf).not.toHaveBeenCalled();
    expect(endSession).not.toHaveBeenCalled();
  });

  it('also warns about a task accepted offline, which signing out would lose', async () => {
    mockState.pendingAccepts = 1;
    const result = await renderViewModel();

    await act(async () => {
      result.current.signOut();
    });

    expect(result.current.signOutMessage).toBe(
      "1 task acceptance hasn't reached the server yet. Signing out now deletes it from this phone.",
    );
  });
});
