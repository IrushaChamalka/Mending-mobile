import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { JSX, ReactNode } from 'react';

import { ApiError } from '@/shared/api/apiError';

import { LoginForm } from '../../components/LoginForm';
import { signIn } from '../../services/session';
import type { SignOutReason } from '../../types';
import { useLoginViewModel } from '../useLoginViewModel';

const mockState = {
  params: {} as { notice?: string },
  signOutReason: null as SignOutReason | null,
  passwordReset: true,
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => mockState.params,
}));
jest.mock('@/shared/config/features', () => ({
  features: {
    get passwordReset(): boolean {
      return mockState.passwordReset;
    },
  },
}));
jest.mock('../../services/session', () => ({ signIn: jest.fn() }));
jest.mock('../useSession', () => ({ useSignOutReason: () => mockState.signOutReason }));

function makeWrapper(): (props: { children: ReactNode }) => JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { gcTime: Infinity } },
  });
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

async function renderViewModel(): Promise<{ current: ReturnType<typeof useLoginViewModel> }> {
  const { result } = await renderHook(() => useLoginViewModel(), { wrapper: makeWrapper() });
  return result;
}

/** The sign-in sheet wired to the view-model, so the tests can type like a user. */
function SignInSheet(): JSX.Element {
  const viewModel = useLoginViewModel();
  return (
    <LoginForm
      control={viewModel.control}
      onSubmit={viewModel.submit}
      onPhoneSubmitEditing={viewModel.focusPassword}
      onForgotPassword={viewModel.openForgotPassword}
      isSubmitting={viewModel.isSubmitting}
      errorMessage={viewModel.errorMessage}
      noticeMessage={viewModel.noticeMessage}
    />
  );
}

describe('useLoginViewModel', () => {
  beforeEach(() => {
    mockState.params = {};
    mockState.signOutReason = null;
    mockState.passwordReset = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens the password reset with the number typed so far', async () => {
    await render(<SignInSheet />, { wrapper: makeWrapper() });

    await fireEvent.changeText(screen.getByTestId('login-phone'), ' 77 123 4567 ');
    await fireEvent.press(screen.getByTestId('login-forgot-password'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/forgot-password',
      params: { phone: '77 123 4567' },
    });
  });

  it('forgets the failed attempt when the reset opens, so its notice shows on return', async () => {
    jest.mocked(signIn).mockRejectedValue(
      new ApiError({
        type: 'unauthorized',
        message: 'Incorrect mobile number or password.',
        retryable: false,
      }),
    );
    await render(<SignInSheet />, { wrapper: makeWrapper() });
    await fireEvent.changeText(screen.getByTestId('login-phone'), '77 123 4567');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'wrong-password');
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByText('Incorrect mobile number or password.')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('login-forgot-password'));

    expect(screen.queryByText('Incorrect mobile number or password.')).toBeNull();
    expect(screen.getByTestId('login-password').props.value).toBe('');
  });

  it('opens the password reset without a number when none is typed', async () => {
    const result = await renderViewModel();

    result.current.openForgotPassword?.();

    expect(router.push).toHaveBeenCalledWith('/forgot-password');
  });

  it('hides the "Forgot password?" link against the real backend', async () => {
    mockState.passwordReset = false;
    await render(<SignInSheet />, { wrapper: makeWrapper() });

    expect(screen.queryByTestId('login-forgot-password')).toBeNull();
  });

  it('says the password changed after a reset', async () => {
    mockState.params = { notice: 'passwordChanged' };
    const result = await renderViewModel();

    expect(result.current.noticeMessage).toBe('Password changed. Sign in with your new password.');
  });

  it('explains an expired session, and ignores unknown notices', async () => {
    mockState.params = { notice: 'somethingElse' };
    mockState.signOutReason = 'expired';
    const result = await renderViewModel();

    expect(result.current.noticeMessage).toBe('Your session has ended. Please sign in again.');
  });

  it('replaces the notice with the red alert when a supervisor signs in', async () => {
    mockState.params = { notice: 'passwordChanged' };
    const message = 'This app is for employees. Supervisors and admins use the web dashboard.';
    jest
      .mocked(signIn)
      .mockRejectedValue(new ApiError({ type: 'forbidden', message, retryable: false }));
    await render(<SignInSheet />, { wrapper: makeWrapper() });

    await fireEvent.changeText(screen.getByTestId('login-phone'), '+9876543210');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'secret1');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText('Password changed. Sign in with your new password.')).toBeNull();
    expect(jest.mocked(signIn).mock.calls[0]?.[0]).toEqual({
      phone: '+9876543210',
      password: 'secret1',
    });
  });
});
