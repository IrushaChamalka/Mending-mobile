import type { JSX } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface TabBarItem {
  key: string;
  label: string;
  icon: IconName;
  accessibilityLabel?: string;
}

export interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onPress: (key: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Bottom tab bar with the teal-100 active pill. Presentational; RouterTabBar connects it to Expo Router. */
export function TabBar({ items, activeKey, onPress, style, testID }: TabBarProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const barInset = { paddingBottom: insets.bottom };
  return (
    <View style={[styles.bar, barInset, style]} testID={testID}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            onPress={() => onPress(item.key)}
            style={styles.item}
          >
            <View style={[styles.pill, active ? styles.pillActive : null]}>
              <Icon name={item.icon} size="lg" color={active ? 'primary' : 'textSecondary'} />
            </View>
            <AppText
              variant="micro"
              weight={active ? 'semibold' : 'medium'}
              color={active ? 'primary' : 'textSecondary'}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    minHeight: sizes.tabBar,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: {
    width: sizes.tabPillWidth,
    height: sizes.tabPillHeight,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  pillActive: { backgroundColor: colors.primarySubtle },
});
