import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

export interface SettingsRowProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Pressable card row with icon, label and chevron (Profile → Sync center). */
export function SettingsRow({
  icon,
  label,
  onPress,
  style,
  testID,
}: SettingsRowProps): JSX.Element {
  return (
    <Card onPress={onPress} padded={false} style={style} testID={testID} accessibilityLabel={label}>
      <View style={styles.row}>
        <Icon name={icon} size="md" color="textMuted" style={styles.icon} />
        <AppText variant="listTitle" style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
        <Icon name="chevron-right" size="sm" color="textPlaceholder" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.settingsRow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  icon: { marginRight: spacing.md },
  label: { flex: 1 },
});
