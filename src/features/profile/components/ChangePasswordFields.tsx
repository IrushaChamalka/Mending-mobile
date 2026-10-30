import type { JSX } from 'react';
import type { Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Banner, FormTextField, PasswordStrengthMeter } from '@/shared/ui';
import { PASSWORD_MIN_LENGTH, type PasswordStrength } from '@/shared/utils/passwordStrength';

import type { ChangePasswordFormValues } from '../data/changePasswordForm';

export interface ChangePasswordFieldsProps {
  control: Control<ChangePasswordFormValues>;
  strength: PasswordStrength | null;
  onSubmit: () => void;
  onNewPasswordSubmitEditing: () => void;
  errorMessage: string | null;
}

/** The E 1.6 password fields on an app page: new password, its strength meter, confirmation. */
export function ChangePasswordFields({
  control,
  strength,
  onSubmit,
  onNewPasswordSubmitEditing,
  errorMessage,
}: ChangePasswordFieldsProps): JSX.Element {
  return (
    <View>
      {errorMessage ? (
        <Banner
          variant="alert"
          tone="danger"
          message={errorMessage}
          style={styles.alert}
          testID="change-password-error"
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
        testID="change-password-new"
      />
      <PasswordStrengthMeter
        strength={strength}
        hint={`Use at least ${PASSWORD_MIN_LENGTH} characters.`}
        style={styles.meter}
        testID="change-password-strength"
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
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        containerStyle={styles.confirm}
        testID="change-password-confirm"
      />
    </View>
  );
}

// The same gaps as E 1.6: 18 dp from the field to the meter, 16 dp from the meter to the next field.
const styles = StyleSheet.create({
  alert: { marginBottom: spacing.lg },
  meter: { marginTop: spacing.lg + spacing.xxs },
  confirm: { marginTop: spacing.lg },
});
