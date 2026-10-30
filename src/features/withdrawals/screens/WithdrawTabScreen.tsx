import type { JSX } from 'react';

import { features } from '@/shared/config/features';

import WithdrawalHistoryScreen from './WithdrawalHistoryScreen';
import WithdrawRequestScreen from './WithdrawRequestScreen';

/**
 * The Withdraw tab's first screen: the request form (E 5.1) where the backend takes requests, and
 * otherwise the payouts an admin recorded (E 5.5), with no way to request one.
 */
export default function WithdrawTabScreen(): JSX.Element {
  return features.withdrawalRequests ? (
    <WithdrawRequestScreen />
  ) : (
    <WithdrawalHistoryScreen isTabRoot />
  );
}
