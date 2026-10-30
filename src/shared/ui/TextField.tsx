import { useState, type ComponentRef, type JSX, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputFocusEvent,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import {
  colors,
  MAX_FONT_SIZE_MULTIPLIER,
  radius,
  sizes,
  spacing,
  textVariants,
} from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'editable'> {
  label?: string;
  /** Shown in red under the field and turns the border red. */
  error?: string;
  helper?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  /** Rendered inside the box before the input (see PhonePrefix). */
  prefix?: ReactNode;
  /** Adds the eye toggle and manages secureTextEntry. */
  secureToggle?: boolean;
  /** Shows "n / maxLength" under the field. */
  showCount?: boolean;
  /** Count-input look: bold teal value, right aligned. */
  valueStyle?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

const HIT_SLOP = spacing.sm;

/** Labelled input matching the 56 dp design field, with focus, error and secure states. */
export function TextField({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  prefix,
  secureToggle = false,
  showCount = false,
  valueStyle = false,
  disabled = false,
  containerStyle,
  ref,
  multiline = false,
  secureTextEntry,
  onFocus,
  onBlur,
  value,
  maxLength,
  placeholderTextColor,
  accessibilityLabel,
  ...rest
}: TextFieldProps): JSX.Element {
  const [focused, setFocused] = useState(false);
  const [secureVisible, setSecureVisible] = useState(false);

  const handleFocus = (event: TextInputFocusEvent): void => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur = (event: TextInputFocusEvent): void => {
    setFocused(false);
    onBlur?.(event);
  };

  const isSecure = secureToggle ? !secureVisible : secureTextEntry;
  const toggleIcon: IconName = secureVisible ? 'eye-off' : 'eye';
  const resolvedRightIcon = secureToggle ? toggleIcon : rightIcon;
  const handleRightPress = secureToggle
    ? () => setSecureVisible((shown) => !shown)
    : onRightIconPress;
  const rightLabel =
    rightIconAccessibilityLabel ??
    (secureToggle ? (secureVisible ? 'Hide password' : 'Show password') : undefined);
  const count =
    showCount && maxLength !== undefined ? `${value?.length ?? 0} / ${maxLength}` : null;

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="label" color="textBody" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          multiline ? styles.boxMultiline : null,
          error ? styles.boxError : focused ? styles.boxFocused : null,
          disabled ? styles.boxDisabled : null,
        ]}
      >
        {leftIcon ? (
          <Icon name={leftIcon} size="md" color="textPlaceholder" style={styles.leftIcon} />
        ) : null}
        {prefix ? <View style={styles.prefix}>{prefix}</View> : null}
        <TextInput
          ref={ref}
          {...rest}
          accessibilityLabel={accessibilityLabel ?? label}
          value={value}
          maxLength={maxLength}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={placeholderTextColor ?? colors.textPlaceholder}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[
            styles.input,
            multiline ? styles.inputMultiline : null,
            valueStyle ? styles.inputValue : null,
            disabled ? styles.inputDisabled : null,
          ]}
        />
        {resolvedRightIcon ? (
          <Pressable
            onPress={handleRightPress}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={rightLabel}
            style={styles.rightIcon}
          >
            <Icon name={resolvedRightIcon} size="md" color="textPlaceholder" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="dangerText" style={styles.helper}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" color="textSecondary" style={styles.helper}>
          {helper}
        </AppText>
      ) : null}
      {count ? (
        <AppText variant="caption" color="textSecondary" align="right" style={styles.helper}>
          {count}
        </AppText>
      ) : null}
    </View>
  );
}

const FOCUS_INSET = sizes.focusBorderWidth - sizes.borderWidth;

const styles = StyleSheet.create({
  label: { marginBottom: spacing.xs + spacing.xxs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.input,
    borderWidth: sizes.borderWidth,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  boxMultiline: {
    minHeight: sizes.inputMultiline,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  boxFocused: {
    borderWidth: sizes.focusBorderWidth,
    borderColor: colors.borderFocus,
    paddingHorizontal: spacing.lg - FOCUS_INSET,
  },
  boxError: { borderColor: colors.danger },
  boxDisabled: { backgroundColor: colors.surfaceMuted },
  leftIcon: { marginRight: spacing.md },
  prefix: { marginRight: spacing.md },
  input: {
    flex: 1,
    ...textVariants.input,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  inputMultiline: { textAlignVertical: 'top', alignSelf: 'stretch' },
  inputValue: { ...textVariants.value, color: colors.primary, textAlign: 'right' },
  inputDisabled: { color: colors.textSecondary },
  rightIcon: { marginLeft: spacing.md },
  helper: { marginTop: spacing.xs },
});
