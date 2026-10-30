import { CameraView } from 'expo-camera';
import type { JSX, RefObject } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Banner, IconButton } from '@/shared/ui';

export interface CameraViewfinderProps {
  cameraRef: RefObject<CameraView | null>;
  /** Mounts the camera. False while the screen is hidden or the app is in the background. */
  isActive: boolean;
  canCapture: boolean;
  isProcessing: boolean;
  errorMessage: string | null;
  title: string;
  onCameraReady: () => void;
  onMountError: () => void;
  onCapture: () => void;
  onClose: () => void;
}

/** Full-screen viewfinder with a back button and the 72 dp shutter ring (not designed; §1.1 recipe). */
export function CameraViewfinder({
  cameraRef,
  isActive,
  canCapture,
  isProcessing,
  errorMessage,
  title,
  onCameraReady,
  onMountError,
  onCapture,
  onClose,
}: CameraViewfinderProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const topInset = { paddingTop: insets.top + spacing.sm };
  const bottomInset = { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg };

  return (
    <View style={styles.root}>
      {isActive ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          responsiveOrientationWhenOrientationLocked
          onCameraReady={onCameraReady}
          onMountError={onMountError}
        />
      ) : null}
      <View style={[styles.topBar, topInset]}>
        <IconButton
          icon="arrow-left"
          variant="overlay"
          accessibilityLabel="Close camera"
          onPress={onClose}
        />
        <View style={styles.titles}>
          <AppText variant="heading" color="primaryText" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color="onPrimaryMuted" numberOfLines={2}>
            Fit the whole sheet in the frame. Every count must be readable.
          </AppText>
        </View>
      </View>
      <View style={styles.middle}>
        {errorMessage ? <Banner variant="alert" tone="danger" message={errorMessage} /> : null}
      </View>
      <View style={[styles.bottomBar, bottomInset]}>
        <Pressable
          onPress={onCapture}
          disabled={!canCapture}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          accessibilityState={{ disabled: !canCapture, busy: isProcessing }}
          style={styles.shutter}
          testID="camera-shutter"
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <View style={[styles.shutterDisc, canCapture ? null : styles.shutterDiscIdle]} />
          )}
        </Pressable>
        <AppText variant="caption" color="primaryText" style={styles.hint}>
          {isProcessing ? 'Preparing the photo…' : 'Tap to take the photo'}
        </AppText>
      </View>
    </View>
  );
}

const SHUTTER_GAP = spacing.xs;
const SHUTTER_DISC = sizes.shutterRing - 2 * (sizes.shutterStroke + SHUTTER_GAP);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cameraBackground },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.cameraOverlay,
  },
  titles: { flex: 1, marginLeft: spacing.md },
  middle: { flex: 1, justifyContent: 'flex-end', padding: spacing.xl },
  bottomBar: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    backgroundColor: colors.cameraOverlay,
  },
  shutter: {
    width: sizes.shutterRing,
    height: sizes.shutterRing,
    borderRadius: radius.full,
    borderWidth: sizes.shutterStroke,
    borderColor: colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisc: {
    width: SHUTTER_DISC,
    height: SHUTTER_DISC,
    borderRadius: radius.full,
    backgroundColor: colors.primaryText,
  },
  shutterDiscIdle: { backgroundColor: colors.overlayOnPrimary },
  hint: { marginTop: spacing.md },
});
