import { LinearGradient } from 'expo-linear-gradient';
import type { JSX, ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';

export type ScreenVariant = 'app' | 'surface' | 'auth';

export interface ScreenProps {
  children: ReactNode;
  /** `app` = slate page, `surface` = white, `auth` = teal gradient (pair with AuthHeader + AuthSheet). */
  variant?: ScreenVariant;
  scroll?: boolean;
  /** Adds the 20 dp side padding of app screens. */
  padded?: boolean;
  /**
   * Fixed content above the body, usually a Header. It owns the top safe-area inset, so the header's
   * white background runs under the status bar as in the designs.
   */
  header?: ReactNode;
  /** Bottom-fixed content (usually a Button) above the safe area. */
  footer?: ReactNode;
  /** False inside the tab shell: the tab bar already pads the home indicator. */
  bottomInset?: boolean;
  edges?: Edge[];
  keyboardAvoiding?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_EDGES: Edge[] = ['top', 'left', 'right'];
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

/** Safe-area wrapper for every screen. */
export function Screen({
  children,
  variant = 'app',
  scroll = false,
  padded = false,
  header,
  footer,
  bottomInset: withBottomInset = true,
  edges = DEFAULT_EDGES,
  keyboardAvoiding = false,
  refreshControl,
  contentStyle,
  testID,
}: ScreenProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomInset = withBottomInset ? Math.max(insets.bottom, spacing.lg) : spacing.lg;
  const footerInset = { paddingBottom: bottomInset };
  const headerInset = { paddingTop: insets.top };
  // The auth sheet pads its own bottom inset, so the gradient never shows below it.
  const contentInset =
    variant === 'auth' || !withBottomInset
      ? null
      : { paddingBottom: footer ? spacing.lg : bottomInset };
  const safeAreaEdges = header ? edges.filter((edge) => edge !== 'top') : edges;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        padded ? styles.padded : null,
        contentInset,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      bounces={variant !== 'auth'}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded ? styles.padded : null, contentInset, contentStyle]}>
      {children}
    </View>
  );

  const content = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={keyboardAvoiding}
    >
      {header ? <View style={[styles.header, headerInset]}>{header}</View> : null}
      {body}
      {footer ? (
        <View style={[styles.footer, padded ? styles.padded : null, footerInset]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );

  if (variant === 'auth') {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex} edges={safeAreaEdges} testID={testID}>
          {content}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, variant === 'surface' ? styles.surface : styles.app]}
      edges={safeAreaEdges}
      testID={testID}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  app: { backgroundColor: colors.background },
  surface: { backgroundColor: colors.surface },
  header: { backgroundColor: colors.surface },
  scrollContent: { flexGrow: 1 },
  padded: { paddingHorizontal: spacing.xl },
  footer: { paddingTop: spacing.lg },
});
