import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { JSX } from 'react';

import { AuthHeader, AuthSheet, Screen } from '@/shared/ui';

import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { useForgotPasswordViewModel } from '../hooks/useForgotPasswordViewModel';

/** Forgot password (E 1.4). Reachable only while `features.passwordReset` is on (mock mode). */
export default function ForgotPasswordScreen(): JSX.Element {
  const viewModel = useForgotPasswordViewModel();

  if (!viewModel.isAvailable) return <Redirect href="/login" />;

  return (
    <Screen variant="auth" scroll keyboardAvoiding>
      <StatusBar style="light" />
      <AuthHeader
        title="Forgot password?"
        subtitle="Enter your mobile number and we'll text you a 6-digit code."
        onBack={viewModel.goBack}
      />
      <AuthSheet>
        <ForgotPasswordForm
          control={viewModel.control}
          onSubmit={viewModel.submit}
          isSubmitting={viewModel.isSubmitting}
          errorMessage={viewModel.errorMessage}
        />
      </AuthSheet>
    </Screen>
  );
}
