import { StatusBar } from 'expo-status-bar';
import type { JSX } from 'react';

import { AuthHeader, AuthSheet, Screen } from '@/shared/ui';

import { LoginForm } from '../components/LoginForm';
import { useLoginViewModel } from '../hooks/useLoginViewModel';

/** Sign-in (E 1.1, with the error states of E 1.2 and E 1.3). */
export default function LoginScreen(): JSX.Element {
  const viewModel = useLoginViewModel();

  return (
    <Screen variant="auth" scroll keyboardAvoiding>
      {/* Light icons on the dark teal header: approved exception to the dark status bar. */}
      <StatusBar style="light" />
      <AuthHeader brand title="Welcome back" subtitle="Sign in to see your tasks and earnings." />
      <AuthSheet>
        <LoginForm
          control={viewModel.control}
          onSubmit={viewModel.submit}
          onPhoneSubmitEditing={viewModel.focusPassword}
          onForgotPassword={viewModel.openForgotPassword}
          isSubmitting={viewModel.isSubmitting}
          errorMessage={viewModel.errorMessage}
          noticeMessage={viewModel.noticeMessage}
        />
      </AuthSheet>
    </Screen>
  );
}
