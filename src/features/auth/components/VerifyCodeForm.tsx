import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Banner, Button, OtpInput, TextButton } from '@/shared/ui';

export interface VerifyCodeFormProps {
  code: string;
  codeLength: number;
  onChangeCode: (value: string) => void;
  isCodeRejected: boolean;
  onVerify: () => void;
  canVerify: boolean;
  isVerifying: boolean;
  /** "00:42" while a new code must wait; null shows the "Resend code" link. */
  resendCountdown: string | null;
  onResend: () => void;
  isResending: boolean;
  errorMessage: string | null;
}

/** The code sheet (E 1.5): six boxes, the resend countdown and "Verify code". */
export function VerifyCodeForm({
  code,
  codeLength,
  onChangeCode,
  isCodeRejected,
  onVerify,
  canVerify,
  isVerifying,
  resendCountdown,
  onResend,
  isResending,
  errorMessage,
}: VerifyCodeFormProps): JSX.Element {
  return (
    <View>
      {errorMessage ? (
        <Banner
          variant="alert"
          tone="danger"
          message={errorMessage}
          style={styles.alert}
          testID="verify-code-error"
        />
      ) : null}
      <OtpInput
        value={code}
        length={codeLength}
        onChangeText={onChangeCode}
        error={isCodeRejected}
        autoFocus
        testID="verify-code-input"
      />
      {resendCountdown ? (
        <AppText color="textSecondary" align="center" style={styles.resend}>
          Resend code in{' '}
          <AppText weight="bold" color="primary">
            {resendCountdown}
          </AppText>
        </AppText>
      ) : (
        <TextButton
          title="Resend code"
          variant="body"
          onPress={onResend}
          disabled={isResending}
          style={[styles.resend, styles.resendLink]}
          testID="verify-code-resend"
        />
      )}
      <Button
        title="Verify code"
        onPress={onVerify}
        disabled={!canVerify && !isVerifying}
        loading={isVerifying}
        style={styles.submit}
        testID="verify-code-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { marginBottom: spacing.lg },
  resend: { marginTop: spacing.lg },
  resendLink: { alignSelf: 'center' },
  submit: { marginTop: spacing.lg },
});
