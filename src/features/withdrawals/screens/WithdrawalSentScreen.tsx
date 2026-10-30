import { Stack, useLocalSearchParams } from 'expo-router';
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import {
  AppText,
  Button,
  EmptyState,
  Header,
  Loader,
  Screen,
  SuccessState,
  SyncStatusPill,
} from '@/shared/ui';

import { useWithdrawalSentViewModel } from '../hooks/useWithdrawalSentViewModel';

/** "Request sent" (E 5.4). */
export default function WithdrawalSentScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const viewModel = useWithdrawalSentViewModel(id);
  const { state, result, syncPill } = viewModel;

  return (
    <Screen
      padded
      bottomInset={false}
      header={
        <Header
          title="Withdraw"
          subtitle="Request a payout"
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
      footer={
        <View style={styles.buttons}>
          <Button
            title="View withdrawal history"
            onPress={viewModel.viewHistory}
            testID="sent-history"
          />
          <Button
            title="Back to home"
            variant="outline"
            onPress={viewModel.backToHome}
            testID="sent-home"
          />
        </View>
      }
    >
      {/* The request is already sent: no swipe back to its review. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      {state === 'loading' ? <Loader fullScreen /> : null}
      {state === 'missing' ? (
        <EmptyState
          icon="list"
          title="We couldn't find this request"
          body="Your requests and their status are listed in your withdrawal history."
          style={styles.center}
        />
      ) : null}
      {state === 'sent' && result ? (
        <View style={styles.center} testID="withdrawal-sent">
          <SuccessState title={result.title} lines={result.lines} badge={result.badge} />
          <AppText variant="caption" color="textPlaceholder" align="center" style={styles.caption}>
            {result.caption}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  caption: { marginTop: spacing.md },
  buttons: { gap: spacing.md + spacing.xxs },
});
