import type { JSX } from 'react';
import { StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme';
import {
  AppText,
  Button,
  ConfirmDialog,
  EmptyState,
  Header,
  NetworkBanner,
  Screen,
  SyncStatusPill,
} from '@/shared/ui';

import { UploadQueueCard } from '../components/UploadQueueCard';
import { useSyncCenterViewModel } from '../hooks/useSyncCenterViewModel';

/** The upload queue (M 6.1 without the conflict card). */
export default function SyncCenterScreen(): JSX.Element {
  const viewModel = useSyncCenterViewModel();
  const { syncPill, discardCandidate } = viewModel;

  return (
    <Screen
      scroll
      padded
      header={
        <Header
          title="Sync center"
          subtitle={viewModel.lastSyncedLabel}
          onBack={viewModel.goBack}
          right={
            <SyncStatusPill
              status={syncPill.status}
              pendingCount={syncPill.pendingCount}
              failedCount={syncPill.failedCount}
            />
          }
        />
      }
      footer={
        <Button
          title="Sync now"
          leftIcon="refresh-cw"
          onPress={viewModel.syncNow}
          loading={viewModel.isSyncing}
          disabled={!viewModel.isOnline}
          testID="sync-now"
        />
      }
    >
      <NetworkBanner
        visible={!viewModel.isOnline}
        pendingCount={viewModel.pendingCount}
        style={styles.banner}
      />
      <AppText
        variant="listTitle"
        weight="bold"
        style={[styles.sectionTitle, viewModel.isOnline ? styles.sectionTitleFirst : null]}
      >
        Queue
      </AppText>
      {viewModel.rows.length > 0 ? (
        <UploadQueueCard
          rows={viewModel.rows}
          onRetry={viewModel.retry}
          onDiscard={viewModel.askToDiscard}
        />
      ) : (
        <EmptyState
          icon="check-circle"
          title="All caught up"
          body="Submissions made on this phone show here until they reach the server."
        />
      )}
      <ConfirmDialog
        visible={discardCandidate !== null}
        title="Discard this submission?"
        message={`The photo and counts for ${discardCandidate?.title ?? 'this task'} will be deleted from this phone. You can submit the task again.`}
        confirmLabel="Discard"
        destructive
        onConfirm={viewModel.confirmDiscard}
        onCancel={viewModel.cancelDiscard}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: 0 },
  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.md },
  /** No offline banner above it: 16 below the header, like the banner would be. */
  sectionTitleFirst: { marginTop: spacing.lg },
});
