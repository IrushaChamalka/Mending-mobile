import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { JSX } from 'react';

import { AuthHeader, AuthSheet, Screen } from '@/shared/ui';

import { NewPasswordForm } from '../components/NewPasswordForm';
import { useNewPasswordViewModel } from '../hooks/useNewPasswordViewModel';

/** New password (E 1.6), the last password-reset step. Saving returns to sign-in. */
export default function NewPasswordScreen(): JSX.Element {
  const viewModel = useNewPasswordViewModel();

  if (viewModel.mustRestart) return <Redirect href="/forgot-password" />;

  return (
    <Screen variant="auth" scroll keyboardAvoiding>
      <StatusBar style="light" />
      <AuthHeader
        title="New password"
        subtitle="Choose a password you have not used before."
        onBack={viewModel.goBack}
      />
      <AuthSheet>
        <NewPasswordForm
          control={viewModel.control}
          strength={viewModel.strength}
          onSubmit={viewModel.submit}
          onNewPasswordSubmitEditing={viewModel.focusConfirm}
          isSubmitting={viewModel.isSubmitting}
          errorMessage={viewModel.errorMessage}
        />
      </AuthSheet>
    </Screen>
  );
}
