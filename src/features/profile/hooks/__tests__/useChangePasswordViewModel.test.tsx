import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { JSX, ReactNode } from 'react';
import Toast from 'react-native-toast-message';

import { ApiError } from '@/shared/api/apiError';
import { mockApiError } from '@/shared/api/mock';
import { logger } from '@/shared/lib/logger';

import { ChangePasswordFields } from '../../components/ChangePasswordFields';
import { changePasswordFieldErrorMap } from '../../data/dto';
import { profileRepository } from '../../data/profileRepository';
import { useChangePasswordViewModel } from '../useChangePasswordViewModel';

const mockRouter = { canGoBack: true };

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => mockRouter.canGoBack,
  },
}));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock('@/features/submission', () => ({
  useSyncPill: () => ({ status: 'synced', pendingCount: 0, failedCount: 0 }),
}));
jest.mock('@/shared/lib/logger', () => ({ logger: { breadcrumb: jest.fn() } }));
jest.mock('../../data/profileRepository', () => ({
  profileRepository: { changePassword: jest.fn() },
}));

const changePassword = jest.mocked(profileRepository.changePassword);

function makeWrapper(): (props: { children: ReactNode }) => JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { gcTime: Infinity } },
  });
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/** The screen's fields wired to the view-model, so the tests can type like a user. */
function ChangePasswordForm(): JSX.Element {
  const viewModel = useChangePasswordViewModel();
  return (
    <ChangePasswordFields
      control={viewModel.control}
      strength={viewModel.strength}
      onSubmit={viewModel.submit}
      onNewPasswordSubmitEditing={viewModel.focusConfirm}
      errorMessage={viewModel.errorMessage}
    />
  );
}

/** Types both fields and saves with the keyboard's return key on the confirmation. */
async function typeAndSave(newPassword: string, confirmPassword = newPassword): Promise<void> {
  await fireEvent.changeText(screen.getByTestId('change-password-new'), newPassword);
  await fireEvent.changeText(screen.getByTestId('change-password-confirm'), confirmPassword);
  await fireEvent(screen.getByTestId('change-password-confirm'), 'submitEditing');
}

describe('useChangePasswordViewModel', () => {
  beforeEach(() => {
    mockRouter.canGoBack = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the sync pill and opens the sync center from it', async () => {
    const { result } = await renderHook(() => useChangePasswordViewModel(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.syncPill.status).toBe('synced');
    expect(result.current.strength).toBeNull();
    result.current.openSyncCenter();
    expect(router.push).toHaveBeenCalledWith('/sync');
  });

  it('saves the new password, confirms with a toast and goes back', async () => {
    changePassword.mockResolvedValue(undefined);
    await render(<ChangePasswordForm />, { wrapper: makeWrapper() });

    await typeAndSave('Kasun@2026');

    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
    expect(changePassword).toHaveBeenCalledWith('Kasun@2026');
    expect(Toast.show).toHaveBeenCalledWith({ type: 'success', text1: 'Password changed.' });
    expect(logger.breadcrumb).toHaveBeenCalledWith('password_changed');
  });

  it('returns to the profile when there is no screen to go back to', async () => {
    mockRouter.canGoBack = false;
    changePassword.mockResolvedValue(undefined);
    await render(<ChangePasswordForm />, { wrapper: makeWrapper() });

    await typeAndSave('Kasun@2026');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/profile');
    });
  });

  it('checks the confirmation before calling the server', async () => {
    await render(<ChangePasswordForm />, { wrapper: makeWrapper() });

    await typeAndSave('Kasun@2026', 'Kasun@2025');

    expect(await screen.findByText('Passwords do not match.')).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("puts the backend's password message on the field, not in the alert", async () => {
    changePassword.mockRejectedValue(
      mockApiError(
        400,
        ['password must be at least 6 characters'],
        { method: 'PATCH', url: '/api/v1/employee/profile' },
        { fieldErrorMap: changePasswordFieldErrorMap },
      ),
    );
    await render(<ChangePasswordForm />, { wrapper: makeWrapper() });

    await typeAndSave('secret1');

    expect(await screen.findByText('password must be at least 6 characters')).toBeTruthy();
    expect(screen.queryByTestId('change-password-error')).toBeNull();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('shows other failures in the red alert and stays on the screen', async () => {
    changePassword.mockRejectedValue(
      new ApiError({
        type: 'network',
        message: "You're offline or the connection dropped. Check your network and try again.",
      }),
    );
    await render(<ChangePasswordForm />, { wrapper: makeWrapper() });

    await typeAndSave('Kasun@2026');

    expect(
      await screen.findByText(
        "You're offline or the connection dropped. Check your network and try again.",
      ),
    ).toBeTruthy();
    expect(Toast.show).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });
});
