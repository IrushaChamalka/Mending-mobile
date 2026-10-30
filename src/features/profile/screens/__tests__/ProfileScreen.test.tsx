import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ProfileViewModel } from '../../hooks/useProfileViewModel';
import ProfileScreen from '../ProfileScreen';

jest.mock('../../hooks/useProfileViewModel', () => ({ useProfileViewModel: jest.fn() }));

const { useProfileViewModel } = jest.requireMock<{ useProfileViewModel: jest.Mock }>(
  '../../hooks/useProfileViewModel',
);

function makeViewModel(overrides: Partial<ProfileViewModel> = {}): ProfileViewModel {
  return {
    name: 'Kasun Fernando',
    roleLabel: 'Employee',
    imageUrl: null,
    employeeId: 'user00006',
    phone: '+94 77 123 4567',
    age: '28',
    gender: 'Male',
    appVersion: 'StitchFlow 1.0.0',
    showPayoutAccount: true,
    syncPill: { status: 'synced', pendingCount: 0, failedCount: 0 },
    isConfirmingSignOut: false,
    signOutMessage: '',
    isSigningOut: false,
    openSyncCenter: jest.fn(),
    openPayoutAccount: jest.fn(),
    openChangePassword: jest.fn(),
    signOut: jest.fn(),
    confirmSignOut: jest.fn(),
    cancelSignOut: jest.fn(),
    ...overrides,
  };
}

describe('ProfileScreen', () => {
  it('shows the details and the account rows (E 6.1)', async () => {
    const viewModel = makeViewModel();
    useProfileViewModel.mockReturnValue(viewModel);
    await render(<ProfileScreen />);

    expect(screen.getByText('Kasun Fernando')).toBeTruthy();
    expect(screen.getByText('Employee')).toBeTruthy();
    expect(screen.getByText('28')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('profile-change-password'));
    expect(viewModel.openChangePassword).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('profile-payout-account'));
    expect(viewModel.openPayoutAccount).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('profile-sign-out'));
    expect(viewModel.signOut).toHaveBeenCalled();
  });

  it('hides the payout account against a backend without it', async () => {
    useProfileViewModel.mockReturnValue(makeViewModel({ showPayoutAccount: false }));
    await render(<ProfileScreen />);
    expect(screen.queryByTestId('profile-payout-account')).toBeNull();
  });
});
