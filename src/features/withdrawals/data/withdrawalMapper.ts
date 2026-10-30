import type { PaymentMethod, SalaryPayment } from '@/features/earnings';
import { toLocalCalendarDate } from '@/shared/utils/date';

import { formatAccountShort } from '../domain/withdrawalRules';
import type { PayoutAccount, Withdrawal, WithdrawalStatus } from '../types';

import type { PayoutAccountDto, WithdrawalDto } from './dto';

const STATUS_BY_DTO: Record<WithdrawalDto['status'], WithdrawalStatus> = {
  PENDING: 'pending',
  PAID: 'paid',
  REJECTED: 'rejected',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  ONLINE_CARD: 'Card',
  OTHER: 'Payout',
};

export function toPayoutAccount(dto: PayoutAccountDto): PayoutAccount {
  return {
    id: dto.id,
    bankName: dto.bankName,
    bankCode: dto.bankCode,
    branchName: dto.branchName?.trim() || null,
    accountHolderName: dto.accountHolderName,
    last4: dto.accountNumberLast4,
    verified: dto.verified,
  };
}

export function toWithdrawal(dto: WithdrawalDto): Withdrawal {
  return {
    id: dto.id,
    reference: dto.referenceNumber,
    amount: dto.amount,
    status: STATUS_BY_DTO[dto.status],
    date: toLocalCalendarDate(dto.requestedAt),
    accountLabel: formatAccountShort({
      bankCode: dto.payoutAccount.bankCode,
      last4: dto.payoutAccount.accountNumberLast4,
    }),
    rejectionReason: dto.rejectionReason?.trim() || null,
  };
}

/** A payout an admin recorded (GET /employee/salary `payments`): always paid. */
export function paymentToWithdrawal(payment: SalaryPayment): Withdrawal {
  return {
    id: payment.id,
    reference: payment.paymentNumber,
    amount: payment.amount,
    status: 'paid',
    date: toLocalCalendarDate(payment.paidAt),
    accountLabel: PAYMENT_METHOD_LABELS[payment.method],
    rejectionReason: null,
  };
}
