import type { SalaryAssignmentDto, SalaryPaymentDto } from '../data/dto';
import type { ApprovedEarning } from '../types';

/** A reviewed assignment as GET /employee/salary sends it (backend-local/samples). */
export function makeSalaryAssignmentDto(
  overrides: Partial<SalaryAssignmentDto> = {},
): SalaryAssignmentDto {
  return {
    assignmentId: 'a1b2c3d4-0000-4000-8000-000000000001',
    orderId: '11111111-1111-4111-8111-111111111111',
    orderNumber: 'ORD-2026-0142',
    customerName: 'Lanka Apparel Ltd',
    branchName: 'Biyagama',
    garmentDescription: 'Denim jacket',
    serviceName: 'Mending',
    serviceCode: 'MEND',
    assignmentDate: '2026-10-08T00:00:00.000Z',
    targetQuantity: 190,
    completedQuantity: 192,
    acceptedQuantity: 190,
    unitEmployeeRate: 18,
    earnedAmount: 3420,
    reviewedAt: '2026-10-08T15:00:00.000Z',
    workerNotes: null,
    reviewNotes: null,
    customerSignatureUrl: null,
    ...overrides,
  };
}

export function makeSalaryPaymentDto(overrides: Partial<SalaryPaymentDto> = {}): SalaryPaymentDto {
  return {
    id: 'p1',
    paymentNumber: 'SAL-2026-0027',
    amount: 6000,
    currency: 'LKR',
    paymentMethod: 'BANK_TRANSFER',
    paidAt: '2026-10-01T09:30:00.000Z',
    referenceNumber: 'BOC-TRX-88213',
    notes: null,
    paidBy: 'Admin User',
    createdAt: '2026-10-01T09:30:00.000Z',
    ...overrides,
  };
}

export function makeApprovedEarning(overrides: Partial<ApprovedEarning> = {}): ApprovedEarning {
  return {
    assignmentId: 'a1',
    orderNumber: 'ORD-2026-0142',
    serviceName: 'Mending',
    date: '2026-10-08',
    acceptedQuantity: 190,
    completedQuantity: 192,
    amount: 3420,
    ...overrides,
  };
}
