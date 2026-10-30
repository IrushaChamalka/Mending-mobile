import { useState, type JSX } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';

export interface OtpInputProps {
  /** The digits typed so far. */
  value: string;
  onChangeText: (value: string) => void;
  /** Number of boxes. */
  length?: number;
  /** Red borders, for a code the server rejected. */
  error?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_LENGTH = 6;
/**
 * The real input lies over the boxes, nearly invisible. iOS ignores touches on views below 1 %
 * opacity, so taps, long-press paste and SMS autofill still reach it.
 */
const HIDDEN_INPUT_OPACITY = 0.011;

/**
 * One-time-code boxes (E 1.5). A single hidden TextInput holds the value, so pasting a code and the
 * keyboard's SMS suggestion (iOS oneTimeCode, Android sms-otp) fill every box at once. The boxes only
 * draw it: the next empty box gets the 2 dp focus border while the input is focused.
 */
export function OtpInput({
  value,
  onChangeText,
  length = DEFAULT_LENGTH,
  error = false,
  autoFocus = false,
  accessibilityLabel = 'Verification code',
  style,
  testID,
}: OtpInputProps): JSX.Element {
  const [focused, setFocused] = useState(false);
  const activeIndex = focused ? Math.min(value.length, length - 1) : -1;
  const boxes = Array.from({ length }, (_, index) => index);

  return (
    <View style={[styles.row, style]}>
      {boxes.map((index) => (
        <View
          key={index}
          style={[
            styles.box,
            index === activeIndex ? styles.boxActive : null,
            error ? styles.boxError : null,
          ]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <AppText variant="title">{value.charAt(index)}</AppText>
        </View>
      ))}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        autoFocus={autoFocus}
        caretHidden
        selectionColor={colors.transparent}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={`${length} digits`}
        style={styles.input}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // About 10 dp between the 48 dp boxes on a 390 dp screen (E 1.5).
  row: { flexDirection: 'row', gap: spacing.sm + spacing.xxs },
  box: {
    flex: 1,
    height: sizes.otpBox,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.borderWidth,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  boxActive: { borderWidth: sizes.focusBorderWidth, borderColor: colors.borderFocus },
  boxError: { borderColor: colors.danger },
  input: {
    ...StyleSheet.absoluteFill,
    color: colors.transparent,
    opacity: HIDDEN_INPUT_OPACITY,
  },
});
