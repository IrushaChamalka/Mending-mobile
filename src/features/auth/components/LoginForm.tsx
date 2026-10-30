import type { JSX } from 'react';
import type { Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import {
  AppText,
  Banner,
  Button,
  Divider,
  FormTextField,
  PhonePrefix,
  TextButton,
} from '@/shared/ui';

import type { LoginFormValues } from '../data/loginForm';

export interface LoginFormProps {
  control: Control<LoginFormValues>;
  onSubmit: () => void;
  onPhoneSubmitEditing: () => void;
  /** Shows the "Forgot password?" link; null while the reset flow has no backend. */
  onForgotPassword: (() => void) | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  noticeMessage: string | null;
}

/** The sign-in sheet's content (E 1.1–1.3). */
export function LoginForm({
  control,
  onSubmit,
  onPhoneSubmitEditing,
  onForgotPassword,
  isSubmitting,
  errorMessage,
  noticeMessage,
}: LoginFormProps): JSX.Element {
  return (
    <View>
      {noticeMessage ? (
        <Banner variant="alert" tone="info" message={noticeMessage} style={styles.alert} />
      ) : null}
      {errorMessage ? (
        <Banner
          variant="alert"
          tone="danger"
          message={errorMessage}
          style={styles.alert}
          testID="login-error"
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
        returnKeyType="next"
        onSubmitEditing={onPhoneSubmitEditing}
        submitBehavior="submit"
        testID="login-phone"
      />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        leftIcon="lock"
        secureToggle
        placeholder="Enter password"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        containerStyle={styles.field}
        testID="login-password"
      />
      {onForgotPassword ? (
        <TextButton
          title="Forgot password?"
          onPress={onForgotPassword}
          style={styles.forgot}
          testID="login-forgot-password"
        />
      ) : null}
      <Button
        title="Sign in"
        onPress={onSubmit}
        loading={isSubmitting}
        style={onForgotPassword ? styles.submitAfterLink : styles.submit}
        testID="login-submit"
      />
      <Divider label="or" style={styles.divider} />
      <AppText variant="label" weight="regular" color="textPlaceholder" align="center">
        Accounts are created by your admin. No sign-up.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { marginBottom: spacing.lg },
  field: { marginTop: spacing.lg },
  // E 1.1: 18 dp from the password field to the link and from the link to the button.
  forgot: { alignSelf: 'flex-end', marginTop: spacing.lg + spacing.xxs },
  submit: { marginTop: spacing.xxl },
  submitAfterLink: { marginTop: spacing.lg + spacing.xxs },
  divider: { marginTop: spacing.lg, marginBottom: spacing.lg },
});
