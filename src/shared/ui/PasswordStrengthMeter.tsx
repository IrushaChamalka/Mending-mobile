import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing, type ColorToken } from '@/shared/theme';
import type { PasswordStrength, PasswordStrengthLevel } from '@/shared/utils/passwordStrength';

import { AppText } from './AppText';

export interface PasswordStrengthMeterProps {
  /** From getPasswordStrength; null (empty password) shows the minimum-length hint instead. */
  strength: PasswordStrength | null;
  /** Shown while the password is empty. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SEGMENTS = [1, 2, 3, 4] as const;

const labelByLevel: Record<PasswordStrengthLevel, string> = {
  weak: 'Weak password',
  fair: 'Fair password',
  strong: 'Strong password',
  veryStrong: 'Very strong password',
};

const labelColorByLevel: Record<PasswordStrengthLevel, ColorToken> = {
  weak: 'dangerText',
  fair: 'warningText',
  strong: 'success',
  veryStrong: 'success',
};

/** Four segments under the new-password field with the strength in words (E 1.6). */
export function PasswordStrengthMeter({
  strength,
  hint,
  style,
  testID,
}: PasswordStrengthMeterProps): JSX.Element {
  const label = strength ? labelByLevel[strength.level] : (hint ?? '');
  return (
    <View style={style} testID={testID}>
      <View style={styles.segments}>
        {SEGMENTS.map((segment) => (
          <View
            key={segment}
            style={[
              styles.segment,
              strength && segment <= strength.score ? filledStyles[strength.level] : null,
            ]}
          />
        ))}
      </View>
      {/* Always one line tall, so the fields below never jump while the user types. */}
      <AppText
        variant="caption"
        color={strength ? labelColorByLevel[strength.level] : 'textSecondary'}
        style={styles.label}
        accessibilityLiveRegion="polite"
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  // 6 dp between segments, as measured on E 1.6.
  segments: { flexDirection: 'row', gap: spacing.xs + spacing.xxs },
  segment: {
    flex: 1,
    height: sizes.strengthBar,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceSunken,
  },
  label: { marginTop: spacing.sm },
});

const filledStyles: Record<PasswordStrengthLevel, ViewStyle> = {
  weak: { backgroundColor: colors.danger },
  fair: { backgroundColor: colors.warning },
  strong: { backgroundColor: colors.success },
  veryStrong: { backgroundColor: colors.success },
};
