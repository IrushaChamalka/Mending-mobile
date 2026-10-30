import { FlashList } from '@shopify/flash-list';
import type { JSX } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import {
  Banner,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  Screen,
  SyncStatusPill,
  TableEmptyRow,
} from '@/shared/ui';

import { WithdrawalFilterChips } from '../components/WithdrawalFilterChips';
import { WithdrawalSummaryCards } from '../components/WithdrawalSummaryCards';
import { WithdrawalTableHeader, WithdrawalTableRow } from '../components/WithdrawalTable';
import {
  useWithdrawalHistoryViewModel,
  type WithdrawalRow,
} from '../hooks/useWithdrawalHistoryViewModel';

export interface WithdrawalHistoryScreenProps {
  /** The Withdraw tab's first screen (requests off): no back button. */
  isTabRoot?: boolean;
}

function keyExtractor(item: WithdrawalRow): string {
  return item.id;
}

function renderRow({ item }: { item: WithdrawalRow }): JSX.Element {
  return (
    <WithdrawalTableRow
      date={item.dateLabel}
      reference={item.reference}
      account={item.accountLabel}
      amount={item.amountLabel}
      status={item.status}
      statusLabel={item.statusLabel}
      last={item.isLast}
      testID={`withdrawal-row-${item.id}`}
    />
  );
}

/** Withdrawal history (E 5.5): totals, status filters and the payouts table. */
export default function WithdrawalHistoryScreen({
  isTabRoot = false,
}: WithdrawalHistoryScreenProps): JSX.Element {
  const viewModel = useWithdrawalHistoryViewModel({ isTabRoot });
  const { state, syncPill } = viewModel;

  return (
    <Screen
      bottomInset={false}
      header={
        <Header
          title="Withdrawals"
          subtitle={viewModel.subtitle}
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
      }
    >
      {state === 'loading' ? <Loader fullScreen label="Loading your withdrawals" /> : null}
      {state === 'waitingForNetwork' ? (
        <EmptyState
          icon="cloud-off"
          title="You're offline"
          body="Your withdrawals will load when you're back online."
        />
      ) : null}
      {state === 'error' ? (
        <ErrorState message={viewModel.loadError?.message} onRetry={viewModel.retry} />
      ) : null}
      {state === 'ready' ? (
        <FlashList
          data={viewModel.rows}
          renderItem={renderRow}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={viewModel.isRefreshing}
              onRefresh={viewModel.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {viewModel.refreshFailed && viewModel.isOnline ? (
                <Banner
                  variant="alert"
                  tone="warning"
                  message="Couldn't refresh. Showing your saved withdrawals."
                />
              ) : null}
              <WithdrawalSummaryCards
                withdrawn={viewModel.withdrawnLabel}
                pending={viewModel.pendingLabel}
              />
              <WithdrawalFilterChips
                options={viewModel.filterOptions}
                selected={viewModel.selectedFilter}
                onSelect={viewModel.selectFilter}
              />
              <WithdrawalTableHeader />
            </View>
          }
          ListEmptyComponent={
            <TableEmptyRow message={viewModel.emptyMessage} testID="withdrawals-empty" />
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  // The chips' 16 dp gap continues into the table card, whose header is the last child here.
  listHeader: { gap: spacing.lg },
});
