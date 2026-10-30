import { useState, type JSX } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  colors,
  MAX_FONT_SIZE_MULTIPLIER,
  radius,
  sizes,
  spacing,
  textVariants,
} from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

export interface AmountFieldProps {
  label: string;
  /** As typed, with thousands commas ("10,000"). */
  value: string;
  onChangeText: (text: string) => void;
  /** Turns the border and value red and shows the message underneath (E 5.2). */
  error: string | null;
  testID?: string;
}

/** Room for "1,000,000.00" and a little more; the balance check does the real limiting. */
const MAX_LENGTH = 16;

/** The big amount input (E 5.1): a 2 dp teal border while focused, red when the amount is invalid. */
export function AmountField({
  label,
  value,
  onChangeText,
  error,
  testID,
}: AmountFieldProps): JSX.Element {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <AppText variant="label" color="textBody" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.box, error ? styles.boxError : focused ? styles.boxFocused : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textPlaceholder}
          maxLength={MAX_LENGTH}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          accessibilityLabel={label}
          style={[styles.input, error ? styles.inputError : null]}
          testID={testID}
        />
      </View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size="xs" color="danger" style={styles.errorIcon} />
          <AppText variant="caption" color="danger" style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const FOCUS_INSET = sizes.focusBorderWidth - sizes.borderWidth;

const styles = StyleSheet.create({
  label: { marginBottom: spacing.sm },
  box: {
    minHeight: sizes.amountInput,
    justifyContent: 'center',
    borderWidth: sizes.borderWidth,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  boxFocused: {
    borderWidth: sizes.focusBorderWidth,
    borderColor: colors.borderFocus,
    paddingHorizontal: spacing.lg - FOCUS_INSET,
  },
  boxError: {
    borderWidth: sizes.focusBorderWidth,
    borderColor: colors.danger,
    paddingHorizontal: spacing.lg - FOCUS_INSET,
  },
  input: { ...textVariants.display, color: colors.textPrimary, paddingVertical: 0 },
  inputError: { color: colors.danger },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  errorIcon: { marginRight: spacing.xs + spacing.xxs },
  errorText: { flex: 1 },
});
