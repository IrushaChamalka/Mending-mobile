import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { bannerTones, radius, sizes, spacing, type BannerTone } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type BannerVariant = 'banner' | 'alert';

export interface BannerProps {
  tone?: BannerTone;
  /** banner = full message box (sync center, photo saved) · alert = compact form alert (login errors). */
  variant?: BannerVariant;
  title?: string;
  message: string;
  /** Defaults to the tone's icon; null for a text-only box (E 3.2 Instructions). */
  icon?: IconName | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const defaultIcons: Record<BannerTone, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'alert-triangle',
  danger: 'alert-circle',
};

/** Tinted message box with icon, optional title and body (login alert, offline notice, photo saved…). */
export function Banner({
  tone = 'info',
  variant = 'banner',
  title,
  message,
  icon,
  style,
  testID,
}: BannerProps): JSX.Element {
  const palette = bannerTones[tone];
  const isAlert = variant === 'alert';
  return (
    <View
      style={[styles.container, isAlert ? styles.alert : null, surfaceStyles[tone], style]}
      testID={testID}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
    >
      {icon === null ? null : (
        <Icon
          name={icon ?? defaultIcons[tone]}
          size="md"
          tintColor={palette.icon}
          style={isAlert ? styles.alertIcon : styles.icon}
        />
      )}
      <View style={styles.texts}>
        {title ? (
          <AppText variant="label" weight="semibold" style={titleStyles[tone]}>
            {title}
          </AppText>
        ) : null}
        <AppText
          variant={isAlert ? 'label' : 'caption'}
          weight={title ? 'regular' : 'medium'}
          style={textStyles[tone]}
        >
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: sizes.borderWidth,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  icon: { marginRight: spacing.md, marginTop: spacing.xxs },
  alert: {
    alignItems: 'center',
    minHeight: sizes.alertMinHeight,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  alertIcon: { marginRight: spacing.sm + spacing.xxs },
  texts: { flex: 1 },
});

const surfaceStyles: Record<BannerTone, ViewStyle> = {
  info: { backgroundColor: bannerTones.info.surface, borderColor: bannerTones.info.border },
  success: {
    backgroundColor: bannerTones.success.surface,
    borderColor: bannerTones.success.border,
  },
  warning: {
    backgroundColor: bannerTones.warning.surface,
    borderColor: bannerTones.warning.border,
  },
  danger: { backgroundColor: bannerTones.danger.surface, borderColor: bannerTones.danger.border },
};

const titleStyles: Record<BannerTone, TextStyle> = {
  info: { color: bannerTones.info.title },
  success: { color: bannerTones.success.title },
  warning: { color: bannerTones.warning.title },
  danger: { color: bannerTones.danger.title },
};

const textStyles: Record<BannerTone, TextStyle> = {
  info: { color: bannerTones.info.text },
  success: { color: bannerTones.success.text },
  warning: { color: bannerTones.warning.text },
  danger: { color: bannerTones.danger.text },
};
