import { toCalendarDate } from '@/shared/utils/date';

import type { ApprovedEarning, PaymentMethod, SalaryPayment } from '../types';

import type { SalaryAssignmentDto, SalaryPaymentDto } from './dto';

const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'BANK_TRANSFER',
  'CASH',
  'CHEQUE',
  'ONLINE_CARD',
];

function textOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toPaymentMethod(value: string): PaymentMethod {
  return PAYMENT_METHODS.find((method) => method === value) ?? 'OTHER';
}

export function toApprovedEarning(dto: SalaryAssignmentDto): ApprovedEarning {
  return {
    assignmentId: dto.assignmentId,
    orderNumber: dto.orderNumber,
    serviceName: textOrNull(dto.serviceName),
    date: toCalendarDate(dto.assignmentDate),
    acceptedQuantity: dto.acceptedQuantity,
    completedQuantity: dto.completedQuantity,
    amount: dto.earnedAmount,
  };
}

export function toSalaryPayment(dto: SalaryPaymentDto): SalaryPayment {
  return {
    id: dto.id,
    paymentNumber: dto.paymentNumber,
    amount: dto.amount,
    method: toPaymentMethod(dto.paymentMethod),
    paidAt: dto.paidAt,
    referenceNumber: textOrNull(dto.referenceNumber),
    notes: textOrNull(dto.notes),
  };
}
