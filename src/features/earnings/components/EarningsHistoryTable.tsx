import { memo, type JSX } from 'react';

import { AppText, TableHeader, TableRow, type TableColumn } from '@/shared/ui';

/** DATE | ORDER · SERVICE | ITEMS | AMOUNT (LKR), as in E 4.2. */
export const EARNINGS_COLUMNS: readonly TableColumn[] = [
  { label: 'Date', flex: 0.9 },
  { label: 'Order · Service', flex: 1.5 },
  { label: 'Items', flex: 0.7, align: 'right' },
  { label: 'Amount (LKR)', flex: 1.3, align: 'right' },
];

export function EarningsTableHeader(): JSX.Element {
  return <TableHeader columns={EARNINGS_COLUMNS} testID="earnings-table" />;
}

export interface EarningsHistoryRowViewProps {
  date: string;
  orderNumber: string;
  serviceName: string;
  items: string;
  amount: string;
  status: 'approved' | 'pending';
  last: boolean;
  testID?: string;
}

function EarningsHistoryRowView({
  date,
  orderNumber,
  serviceName,
  items,
  amount,
  status,
  last,
  testID,
}: EarningsHistoryRowViewProps): JSX.Element {
  const isApproved = status === 'approved';
  return (
    <TableRow columns={EARNINGS_COLUMNS} last={last} testID={testID}>
      <AppText variant="label" weight="regular" color="textBody">
        {date}
      </AppText>
      <>
        <AppText variant="label" weight="bold" numberOfLines={1}>
          {orderNumber}
        </AppText>
        <AppText variant="micro" weight="regular" color="textSecondary" numberOfLines={1}>
          {serviceName}
        </AppText>
      </>
      <AppText variant="label" weight="regular" color="textBody">
        {items}
      </AppText>
      <>
        <AppText variant="label" weight="bold" align="right">
          {amount}
        </AppText>
        <AppText
          variant="micro"
          weight="semibold"
          color={isApproved ? 'successText' : 'warningText'}
          align="right"
        >
          {isApproved ? 'Approved' : 'Pending'}
        </AppText>
      </>
    </TableRow>
  );
}

/** One assignment-day of earnings. Memoised for the FlashList. */
export const EarningsHistoryRow = memo(EarningsHistoryRowView);

export interface EarningsSubtotalRowProps {
  items: string;
  amount: string;
}

/** The teal subtotal that closes the table (E 4.2). */
export function EarningsSubtotalRow({ items, amount }: EarningsSubtotalRowProps): JSX.Element {
  return (
    <TableRow columns={EARNINGS_COLUMNS} tone="total" last testID="earnings-subtotal">
      <AppText variant="label" weight="bold" color="primaryStrong" numberOfLines={1}>
        Subtotal
      </AppText>
      {null}
      <AppText variant="label" weight="bold" color="primaryStrong">
        {items}
      </AppText>
      <AppText variant="bodyStrong" weight="bold" color="primaryStrong" align="right">
        {amount}
      </AppText>
    </TableRow>
  );
}
