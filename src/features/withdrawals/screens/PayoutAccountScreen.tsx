import type { JSX } from 'react';
import { StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme';
import {
  Banner,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  Screen,
  SyncStatusPill,
} from '@/shared/ui';

import { PayoutAccountDetails } from '../components/PayoutAccountDetails';
import { usePayoutAccountViewModel } from '../hooks/usePayoutAccountViewModel';

/** The bank account payouts go to, read-only (not designed; opened from E 5.1 and E 6.1). */
export default function PayoutAccountScreen(): JSX.Element {
  const viewModel = usePayoutAccountViewModel();
  const { state, account, syncPill } = viewModel;

  return (
    <Screen
      scroll={state === 'ready'}
      padded
      bottomInset={false}
      contentStyle={styles.content}
      header={
        <Header
          title="Payout account"
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
      {state === 'loading' ? <Loader fullScreen label="Loading your payout account" /> : null}
      {state === 'waitingForNetwork' ? (
        <EmptyState
          icon="cloud-off"
          title="You're offline"
          body="Your payout account will load when you're back online."
        />
      ) : null}
      {state === 'error' ? (
        <ErrorState message={viewModel.loadError?.message} onRetry={viewModel.retry} />
      ) : null}
      {state === 'unavailable' ? (
        <EmptyState
          icon="bank"
          title="Payouts are arranged by your admin"
          body="Your admin records how and where each payout is paid. Ask them if your bank details change."
          testID="payout-account-unavailable"
        />
      ) : null}
      {account ? (
        <>
          <PayoutAccountDetails
            bankName={account.bankName}
            branch={account.branch}
            verified={account.verified}
            rows={account.rows}
            testID="payout-account"
          />
          <Banner message="To change your payout account, contact your admin." />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
});
