import type { JSX } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  OptionSheet,
  Screen,
  SyncStatusPill,
} from '@/shared/ui';

import { ApprovedEarningsChart } from '../components/ApprovedEarningsChart';
import { EarningsSummaryCard } from '../components/EarningsSummaryCard';
import { PeriodSelector } from '../components/PeriodSelector';
import { useEarningsViewModel } from '../hooks/useEarningsViewModel';

/** Earnings overview (E 4.1). */
export default function EarningsScreen(): JSX.Element {
  const viewModel = useEarningsViewModel();
  const { syncPill, summary } = viewModel;

  const header = (
    <Header
      title="Earnings"
      subtitle="Salary & earnings"
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

  if (!summary) {
    return (
      <Screen header={header} bottomInset={false}>
        {viewModel.state === 'loading' ? <Loader fullScreen label="Loading your earnings" /> : null}
        {viewModel.state === 'waitingForNetwork' ? (
          <EmptyState
            icon="cloud-off"
            title="You're offline"
            body="Your earnings will load when you're back online."
          />
        ) : null}
        {viewModel.state === 'error' ? (
          <ErrorState message={viewModel.loadError?.message} onRetry={viewModel.retry} />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      padded
      bottomInset={false}
      header={header}
      footer={
        <Button
          title="View earnings history"
          onPress={viewModel.openHistory}
          testID="earnings-history"
        />
      }
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
        {viewModel.refreshFailed ? (
          <Banner
            variant="alert"
            tone="warning"
            message="Couldn't refresh. Showing your saved earnings."
          />
        ) : null}
        <PeriodSelector label={viewModel.periodLabel} onChange={viewModel.openPeriodSheet} />
        <EarningsSummaryCard
          estimated={summary.estimated}
          approved={summary.approved}
          withdrawn={summary.withdrawn}
          available={summary.available}
        />
        <ApprovedEarningsChart bars={viewModel.bars} />
        <Banner variant="alert" tone="info" icon="lock" message="Only you can see your earnings." />
      </View>
      <OptionSheet
        visible={viewModel.isPeriodSheetOpen}
        title="Show earnings for"
        options={viewModel.periodOptions}
        selected={viewModel.selectedPreset}
        onSelect={viewModel.selectPreset}
        onClose={viewModel.closePeriodSheet}
        testID="earnings-period-sheet"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
});
