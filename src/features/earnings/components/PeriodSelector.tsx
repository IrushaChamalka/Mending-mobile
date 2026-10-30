import type { JSX } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

export interface PeriodSelectorProps {
  /** "1–9 Oct 2026". */
  label: string;
  onChange: () => void;
}

/** The period title and its "Change" button (E 4.1). */
export function PeriodSelector({ label, onChange }: PeriodSelectorProps): JSX.Element {
  return (
    <View style={styles.row}>
      <AppText variant="cardTitle" style={styles.label} accessibilityRole="header">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change period. Now ${label}`}
        onPress={onChange}
        style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
        testID="earnings-change-period"
      >
        <Icon name="calendar" size="sm" color="textMuted" />
        <AppText variant="buttonXs" color="textPrimary" style={styles.buttonLabel}>
          Change
        </AppText>
        <Icon name="chevron-down" size="sm" color="textMuted" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { flex: 1 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: sizes.buttonSm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: sizes.borderWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  buttonLabel: { marginHorizontal: spacing.sm },
});
