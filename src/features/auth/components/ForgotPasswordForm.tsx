import type { JSX } from 'react';
import type { Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Banner, Button, FormTextField, PhonePrefix } from '@/shared/ui';

import type { ForgotPasswordFormValues } from '../data/passwordResetForm';

export interface ForgotPasswordFormProps {
  control: Control<ForgotPasswordFormValues>;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

/** The forgot-password sheet (E 1.4): the mobile number and "Send code". */
export function ForgotPasswordForm({
  control,
  onSubmit,
  isSubmitting,
  errorMessage,
}: ForgotPasswordFormProps): JSX.Element {
  return (
    <View>
      {errorMessage ? (
        <Banner
          variant="alert"
          tone="danger"
          message={errorMessage}
          style={styles.alert}
          testID="forgot-password-error"
        />
      ) : null}
      <FormTextField
        control={control}
        name="phone"
        label="Mobile number"
        prefix={<PhonePrefix />}
        placeholder="77 123 4567"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        returnKeyType="send"
        onSubmitEditing={onSubmit}
        testID="forgot-password-phone"
      />
      <Button
        title="Send code"
        onPress={onSubmit}
        loading={isSubmitting}
        style={styles.submit}
        testID="forgot-password-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { marginBottom: spacing.lg },
  // 18 dp from the field to the button (E 1.4).
  submit: { marginTop: spacing.lg + spacing.xxs },
});
