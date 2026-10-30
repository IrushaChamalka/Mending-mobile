import { useLocalSearchParams } from 'expo-router';
import type { JSX } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { TaskUploadNotice } from '@/features/submission';
import { colors, spacing } from '@/shared/theme';
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  Screen,
  SyncStatusPill,
} from '@/shared/ui';

import {
  TaskFactsCard,
  TaskInstructions,
  TaskPhotos,
  TaskProgressTiles,
  TaskReviewNotice,
} from '../components/TaskDetailSections';
import { useTaskDetailViewModel } from '../hooks/useTaskDetailViewModel';

/** Task detail (E 3.2) with the backend's accept and photo-submit actions in the footer. */
export default function TaskDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewModel = useTaskDetailViewModel(id);
  const { task, upload, syncPill } = viewModel;

  const header = (
    <Header
      title={viewModel.heading}
      subtitle={viewModel.customerName ?? undefined}
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

  if (!task) {
    return (
      <Screen header={header} bottomInset={false}>
        {viewModel.state === 'loading' ? <Loader fullScreen /> : null}
        {viewModel.state === 'waitingForNetwork' ? (
          <EmptyState
            icon="cloud-off"
            title="You're offline"
            body="This task will load when you're back online."
          />
        ) : null}
        {viewModel.state === 'error' ? (
          <ErrorState message={viewModel.loadError?.message} onRetry={viewModel.retry} />
        ) : null}
        {viewModel.state === 'notFound' ? (
          <EmptyState
            icon="search"
            title="Task not found"
            body="It may have been removed or reassigned."
            actionLabel="Back to tasks"
            onAction={viewModel.goBack}
            actionVariant="outline"
          />
        ) : null}
      </Screen>
    );
  }

  let footer: JSX.Element | undefined;
  if (viewModel.canAccept) {
    footer = (
      <Button
        title="Accept task"
        leftIcon="check"
        onPress={viewModel.accept}
        loading={viewModel.isAccepting}
        testID="task-accept"
      />
    );
  } else if (upload?.status === 'failed' && (upload.canRetry || viewModel.canRetake)) {
    footer = (
      <View style={styles.footerButtons}>
        {upload.canRetry ? (
          <Button
            title="Retry upload"
            leftIcon="refresh-cw"
            onPress={viewModel.retryUpload}
            testID="task-retry-upload"
          />
        ) : null}
        {viewModel.canRetake ? (
          <Button
            title="Take a new photo"
            leftIcon="camera"
            variant={upload.canRetry ? 'outline' : 'primary'}
            onPress={viewModel.completeTask}
            testID="task-retake"
          />
        ) : null}
      </View>
    );
  } else if (viewModel.canSubmit) {
    footer = (
      <Button
        title="Submit today's work"
        leftIcon="camera"
        onPress={viewModel.completeTask}
        testID="task-complete"
      />
    );
  }

  return (
    <Screen
      scroll
      padded
      bottomInset={false}
      header={header}
      footer={footer}
      refreshControl={
        <RefreshControl
          refreshing={viewModel.isRefreshing}
          onRefresh={viewModel.refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.content}>
        <TaskFactsCard title={task.title} facts={viewModel.facts} />
        {upload ? <TaskUploadNotice upload={upload} isOnline={viewModel.isOnline} /> : null}
        {viewModel.acceptError ? (
          <Banner variant="alert" tone="danger" message={viewModel.acceptError} />
        ) : null}
        {viewModel.isAcceptQueued ? (
          <Banner
            variant="alert"
            tone="info"
            icon="cloud-off"
            message="Accepted on this device. It will sync when you're back online."
          />
        ) : null}
        {task.instructions ? <TaskInstructions text={task.instructions} /> : null}
        {viewModel.photos.length > 0 ? <TaskPhotos photos={viewModel.photos} /> : null}
        {viewModel.progress ? <TaskProgressTiles counts={viewModel.progress} /> : null}
        {task.review ? <TaskReviewNotice review={task.review} /> : null}
        {task.latestSubmission?.note && !task.review ? (
          <Banner
            tone="info"
            icon="message-square"
            title="Your note"
            message={task.latestSubmission.note}
          />
        ) : null}
        {viewModel.statusNote ? (
          <Banner
            variant="alert"
            tone={viewModel.statusNote.tone}
            message={viewModel.statusNote.message}
            testID="task-status-note"
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  footerButtons: { gap: spacing.md + spacing.xxs },
});
