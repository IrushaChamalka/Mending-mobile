import { memo, type JSX } from 'react';

import type { StatusTone } from '@/shared/theme';
import { AppText, Badge, TableHeader, TableRow, type TableColumn } from '@/shared/ui';

import type { WithdrawalStatus } from '../types';

/** DATE | REFERENCE · ACCOUNT | AMOUNT | STATUS (E 5.5). */
const COLUMNS: readonly TableColumn[] = [
  { label: 'Date', flex: 1 },
  { label: 'Reference · Account', flex: 1.75 },
  { label: 'Amount', flex: 1.15, align: 'right' },
  { label: 'Status', flex: 1.6 },
];

const STATUS_TONES: Record<WithdrawalStatus, StatusTone> = {
  pending: 'warning',
  paid: 'success',
  rejected: 'danger',
};

/** The table card's top; render it last in the list header so the rows continue the card. */
export function WithdrawalTableHeader(): JSX.Element {
  return <TableHeader columns={COLUMNS} />;
}

export interface WithdrawalTableRowProps {
  /** "9 Oct". */
  date: string;
  /** "WD-0031". */
  reference: string;
  /** "BOC ···· 4421" or "Bank transfer". */
  account: string;
  /** "10,000". */
  amount: string;
  status: WithdrawalStatus;
  statusLabel: string;
  /** Closes the card. */
  last: boolean;
  testID?: string;
}

/** One payout. Memoised: FlashList re-renders only the rows whose values change. */
export const WithdrawalTableRow = memo(function WithdrawalTableRow({
  date,
  reference,
  account,
  amount,
  status,
  statusLabel,
  last,
  testID,
}: WithdrawalTableRowProps): JSX.Element {
  return (
    <TableRow columns={COLUMNS} last={last} testID={testID}>
      <AppText variant="label" weight="regular" color="textBody" numberOfLines={1}>
        {date}
      </AppText>
      <>
        <AppText variant="label" weight="bold" numberOfLines={1}>
          {reference}
        </AppText>
        <AppText variant="caption" color="textPlaceholder" numberOfLines={1}>
          {account}
        </AppText>
      </>
      <AppText variant="label" weight="bold" numberOfLines={1} adjustsFontSizeToFit>
        {amount}
      </AppText>
      <Badge label={statusLabel} tone={STATUS_TONES[status]} dot />
    </TableRow>
  );
});
