import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { JSX, ReactNode } from 'react';

import { logger } from '@/shared/lib/logger';
import { mockApiError } from '@/shared/api/mock';

import { NewPasswordForm } from '../../components/NewPasswordForm';
import { passwordResetRepository } from '../../data/passwordResetRepository';
import { useNewPasswordViewModel } from '../useNewPasswordViewModel';

const mockParams: { resetToken?: string } = {};

jest.mock('expo-router', () => ({
  router: { dismissTo: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/shared/config/features', () => ({ features: { passwordReset: true } }));
jest.mock('@/shared/lib/logger', () => ({ logger: { breadcrumb: jest.fn() } }));
jest.mock('../../data/passwordResetRepository', () => ({
  passwordResetRepository: { completeReset: jest.fn() },
}));

const completeReset = jest.mocked(passwordResetRepository.completeReset);

/** The E 1.6 sheet wired to the view-model. */
function NewPasswordSheet(): JSX.Element {
  const viewModel = useNewPasswordViewModel();
  return (
    <NewPasswordForm
      control={viewModel.control}
      strength={viewModel.strength}
      onSubmit={viewModel.submit}
      onNewPasswordSubmitEditing={viewModel.focusConfirm}
      isSubmitting={viewModel.isSubmitting}
      errorMessage={viewModel.errorMessage}
    />
  );
}

async function renderSheet(): Promise<void> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { gcTime: Infinity } },
  });
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  await render(<NewPasswordSheet />, { wrapper: Wrapper });
}

async function typePasswords(newPassword: string, confirmPassword: string): Promise<void> {
  await fireEvent.changeText(screen.getByTestId('new-password-input'), newPassword);
  await fireEvent.changeText(screen.getByTestId('new-password-confirm'), confirmPassword);
}

describe('useNewPasswordViewModel', () => {
  beforeEach(() => {
    mockParams.resetToken = 'reset-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rates the new password as it is typed', async () => {
    await renderSheet();
    expect(screen.getByText('Use at least 6 characters.')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('new-password-input'), 'Kasun@2026');

    expect(screen.getByText('Strong password')).toBeTruthy();
  });

  it('does not save when the confirmation differs', async () => {
    await renderSheet();

    await typePasswords('Kasun@2026', 'Kasun@2025');
    await fireEvent.press(screen.getByTestId('new-password-submit'));

    expect(await screen.findByText('Passwords do not match.')).toBeTruthy();
    expect(completeReset).not.toHaveBeenCalled();
  });

  it('saves, then returns to sign-in with the password-changed notice', async () => {
    completeReset.mockResolvedValue(undefined);
    await renderSheet();

    await typePasswords('Kasun@2026', 'Kasun@2026');
    await fireEvent.press(screen.getByTestId('new-password-submit'));

    await waitFor(() => {
      expect(router.dismissTo).toHaveBeenCalledWith({
        pathname: '/login',
        params: { notice: 'passwordChanged' },
      });
    });
    expect(completeReset).toHaveBeenCalledWith('reset-token', 'Kasun@2026');
    expect(logger.breadcrumb).toHaveBeenCalledWith('password_reset');
  });

  it('shows an expired reset in the red alert', async () => {
    completeReset.mockRejectedValue(
      mockApiError(
        400,
        'Your reset code has expired. Ask for a new code.',
        { method: 'POST', url: '/api/v1/auth/mobile/password-reset/complete' },
        { useServerMessage: true },
      ),
    );
    await renderSheet();

    await typePasswords('Kasun@2026', 'Kasun@2026');
    await fireEvent.press(screen.getByTestId('new-password-submit'));

    expect(
      await screen.findByText('Your reset code has expired. Ask for a new code.'),
    ).toBeTruthy();
    expect(router.dismissTo).not.toHaveBeenCalled();
  });
});
