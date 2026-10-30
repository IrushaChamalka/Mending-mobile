import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { JSX } from 'react';
import { StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme';
import { EmptyState, Header, Loader, Screen, SyncStatusPill } from '@/shared/ui';

import { CameraViewfinder } from '../components/CameraViewfinder';
import { PhotoReview } from '../components/PhotoReview';
import { useCaptureViewModel } from '../hooks/useCaptureViewModel';

/** Photograph the tally sheet with the in-app camera, then retake or use the photo. */
export default function CaptureScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewModel = useCaptureViewModel(id);
  const { state, task } = viewModel;

  if (state === 'camera') {
    return (
      <>
        {/* Light status-bar content over the dark viewfinder, only while it is on screen. */}
        {viewModel.isCameraActive ? <StatusBar style="light" /> : null}
        <CameraViewfinder
          cameraRef={viewModel.cameraRef}
          isActive={viewModel.isCameraActive}
          canCapture={viewModel.canCapture}
          isProcessing={viewModel.isProcessing}
          errorMessage={viewModel.errorMessage}
          title={task?.title ?? 'Tally sheet photo'}
          onCameraReady={viewModel.onCameraReady}
          onMountError={viewModel.onCameraMountError}
          onCapture={viewModel.takePhoto}
          onClose={viewModel.goBack}
        />
      </>
    );
  }

  const { syncPill } = viewModel;
  const header = (
    <Header
      title="Tally sheet photo"
      subtitle={task?.title}
      onBack={viewModel.goBack}
      right={
        <SyncStatusPill
          status={syncPill.status}
          pendingCount={syncPill.pendingCount}
          failedCount={syncPill.failedCount}
          onPress={viewModel.openSyncCenter}
        />
      }
    />
  );

  if (state === 'preview' && viewModel.photo) {
    return (
      <Screen scroll padded header={header} contentStyle={styles.content}>
        <PhotoReview
          photoUri={viewModel.photo.uri}
          onRetake={viewModel.retake}
          onConfirm={viewModel.confirmPhoto}
        />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      {state === 'checkingPermission' ? <Loader fullScreen /> : null}
      {state === 'askPermission' ? (
        <EmptyState
          icon="camera"
          title="Allow camera access"
          body="StitchFlow uses the camera to photograph your tally sheet. A photo is only taken when you press the shutter."
          actionLabel="Allow camera"
          onAction={viewModel.requestPermission}
          testID="capture-ask-permission"
        />
      ) : null}
      {state === 'permissionBlocked' ? (
        <EmptyState
          icon="camera-off"
          title="Camera access is off"
          body="Turn on camera access for StitchFlow in your phone's settings to photograph your tally sheet."
          actionLabel="Open settings"
          onAction={viewModel.openSettings}
          testID="capture-permission-blocked"
        />
      ) : null}
      {state === 'unavailable' ? (
        <EmptyState
          icon="slash"
          title="This task can't take a submission"
          body="It may already be submitted, reviewed or no longer assigned to you."
          actionLabel="Back"
          actionVariant="outline"
          onAction={viewModel.goBack}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg },
});
