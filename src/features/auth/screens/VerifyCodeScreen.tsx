import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { JSX } from 'react';

import { AuthHeader, AuthSheet, Screen } from '@/shared/ui';

import { VerifyCodeForm } from '../components/VerifyCodeForm';
import { useVerifyCodeViewModel } from '../hooks/useVerifyCodeViewModel';

/** Code check (E 1.5), the second password-reset step. */
export default function VerifyCodeScreen(): JSX.Element {
  const viewModel = useVerifyCodeViewModel();

  if (viewModel.mustRestart) return <Redirect href="/forgot-password" />;

  return (
    <Screen variant="auth" scroll keyboardAvoiding>
      <StatusBar style="light" />
      <AuthHeader
        title="Enter the code"
        subtitle={`We sent a 6-digit code to ${viewModel.phoneLabel}.`}
        onBack={viewModel.goBack}
      />
      <AuthSheet>
        <VerifyCodeForm
          code={viewModel.code}
          codeLength={viewModel.codeLength}
          onChangeCode={viewModel.setCode}
          isCodeRejected={viewModel.isCodeRejected}
          onVerify={viewModel.verify}
          canVerify={viewModel.canVerify}
          isVerifying={viewModel.isVerifying}
          resendCountdown={viewModel.resendCountdown}
          onResend={viewModel.resend}
          isResending={viewModel.isResending}
          errorMessage={viewModel.errorMessage}
        />
      </AuthSheet>
    </Screen>
  );
}
