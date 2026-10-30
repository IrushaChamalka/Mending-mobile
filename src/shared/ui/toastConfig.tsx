import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

import { bannerTones, colors, radius, sizes, spacing, type BannerTone } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ToastCardProps {
  tone: BannerTone;
  icon: IconName;
  text1?: string;
  text2?: string;
}

function ToastCard({ tone, icon, text1, text2 }: ToastCardProps): JSX.Element {
  return (
    <View style={styles.card}>
      <Icon name={icon} size="md" tintColor={bannerTones[tone].icon} style={styles.icon} />
      <View style={styles.texts}>
        {text1 ? (
          <AppText variant="label" weight="semibold" numberOfLines={2}>
            {text1}
          </AppText>
        ) : null}
        {text2 ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={3}>
            {text2}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** Toast renderers in the card style. The Toast host is mounted by AppProviders. */
export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard tone="success" icon="check-circle" text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard tone="danger" icon="alert-circle" text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard tone="info" icon="info" text1={text1} text2={text2} />
  ),
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  icon: { marginRight: spacing.md },
  texts: { flex: 1 },
});
