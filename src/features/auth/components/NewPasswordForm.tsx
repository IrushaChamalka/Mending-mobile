import type { JSX } from 'react';
import type { Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Banner, Button, FormTextField, PasswordStrengthMeter } from '@/shared/ui';
import { PASSWORD_MIN_LENGTH, type PasswordStrength } from '@/shared/utils/passwordStrength';

import type { NewPasswordFormValues } from '../data/passwordResetForm';

export interface NewPasswordFormProps {
  control: Control<NewPasswordFormValues>;
  strength: PasswordStrength | null;
  onSubmit: () => void;
  onNewPasswordSubmitEditing: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

/** The new-password sheet (E 1.6): new password with its strength meter, confirmation, save. */
export function NewPasswordForm({
  control,
  strength,
  onSubmit,
  onNewPasswordSubmitEditing,
  isSubmitting,
  errorMessage,
}: NewPasswordFormProps): JSX.Element {
  return (
    <View>
      {errorMessage ? (
        <Banner
          variant="alert"
          tone="danger"
          message={errorMessage}
          style={styles.alert}
          testID="new-password-error"
        />
      ) : null}
      <FormTextField
        control={control}
        name="newPassword"
        label="New password"
        leftIcon="lock"
        secureToggle
        placeholder="Enter new password"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="next"
        onSubmitEditing={onNewPasswordSubmitEditing}
        submitBehavior="submit"
        testID="new-password-input"
      />
      <PasswordStrengthMeter
        strength={strength}
        hint={`Use at least ${PASSWORD_MIN_LENGTH} characters.`}
        style={styles.meter}
        testID="new-password-strength"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirm password"
        leftIcon="lock"
        secureToggle
        placeholder="Enter it again"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        containerStyle={styles.confirm}
        testID="new-password-confirm"
      />
      <Button
        title="Save password"
        onPress={onSubmit}
        loading={isSubmitting}
        style={styles.submit}
        testID="new-password-submit"
      />
    </View>
  );
}

// Measured on E 1.6: 18 dp from a field to the meter or the button, 16 dp from the meter label to
// the next field.
const styles = StyleSheet.create({
  alert: { marginBottom: spacing.lg },
  meter: { marginTop: spacing.lg + spacing.xxs },
  confirm: { marginTop: spacing.lg },
  submit: { marginTop: spacing.lg + spacing.xxs },
});
