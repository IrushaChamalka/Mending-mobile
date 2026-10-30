import type { JSX } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface SheetOption<TValue extends string> {
  value: TValue;
  label: string;
  /** Second line, e.g. the dates a period covers. */
  detail?: string;
}

export interface OptionSheetProps<TValue extends string> {
  visible: boolean;
  title: string;
  options: readonly SheetOption<TValue>[];
  selected: TValue | null;
  onSelect: (value: TValue) => void;
  onClose: () => void;
  testID?: string;
}

function swallowPress(): void {
  // Keeps taps inside the sheet from reaching the backdrop.
}

/** Bottom sheet with a single-choice list (the earnings "Change" period picker). Not designed. */
export function OptionSheet<TValue extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  testID,
}: OptionSheetProps<TValue>): JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomInset = { paddingBottom: Math.max(insets.bottom, spacing.lg) };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Pressable style={[styles.sheet, bottomInset]} onPress={swallowPress} testID={testID}>
          <View style={styles.handle} />
          <AppText variant="heading" style={styles.title}>
            {title}
          </AppText>
          {options.map((option) => {
            const isSelected = option.value === selected;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(option.value);
                }}
                style={({ pressed }) => [styles.option, pressed ? styles.pressed : null]}
                testID={testID ? `${testID}-${option.value}` : undefined}
              >
                <View style={styles.texts}>
                  <AppText variant="listTitle" color={isSelected ? 'primary' : 'textPrimary'}>
                    {option.label}
                  </AppText>
                  {option.detail ? (
                    <AppText variant="caption" color="textSecondary">
                      {option.detail}
                    </AppText>
                  ) : null}
                </View>
                {isSelected ? <Icon name="check" size="md" color="primary" /> : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: sizes.sheetHandleWidth,
    height: sizes.sheetHandle,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.sm },
  option: {
    minHeight: sizes.settingsRow,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: sizes.borderWidth,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  texts: { flex: 1 },
});
