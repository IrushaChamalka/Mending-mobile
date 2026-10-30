/**
 * Mock earnings api for EXPO_PUBLIC_USE_MOCK_API=true. Approved earnings come from the mock tasks'
 * reviewed assignments, exactly as the backend sums them, so the earnings screens agree with the
 * task list. Two recorded payouts make LKR 10,000 withdrawn, as in the designs.
 */
import { getSessionUser } from '@/features/auth';
import { listMockTasks } from '@/features/tasks';
import { mockDelay } from '@/shared/api/mock';
import { shiftCalendarDate, todayCalendarDate } from '@/shared/utils/date';
import { roundToCents } from '@/shared/utils/number';

import type { SalaryAssignmentDto, SalaryPaymentDto, SalaryResponseDto } from '../data/dto';

import type { EarningsApi } from './earningsApi';

function paidAt(daysFromToday: number): string {
  return `${shiftCalendarDate(todayCalendarDate(), daysFromToday)}T09:30:00.000Z`;
}

function mockPayments(): SalaryPaymentDto[] {
  return [
    {
      id: '9a1b2c3d-0000-4000-8000-000000000027',
      paymentNumber: 'SAL-2026-0027',
      amount: 6000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paidAt: paidAt(-12),
      referenceNumber: 'BOC-TRX-88213',
      notes: null,
      paidBy: 'Admin User',
      createdAt: paidAt(-12),
    },
    {
      id: '9a1b2c3d-0000-4000-8000-000000000019',
      paymentNumber: 'SAL-2026-0019',
      amount: 4000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paidAt: paidAt(-25),
      referenceNumber: 'BOC-TRX-87102',
      notes: null,
      paidBy: 'Admin User',
      createdAt: paidAt(-25),
    },
  ];
}

function approvedAssignments(): SalaryAssignmentDto[] {
  return listMockTasks()
    .filter((task) => task.status === 'REVIEWED')
    .map((task) => {
      const rate = task.unitRate ?? 0;
      return {
        assignmentId: task.assignmentId,
        orderId: task.orderId,
        orderNumber: task.orderNumber ?? 'ORD',
        customerName: task.customerName ?? null,
        branchName: task.location ?? null,
        garmentDescription: task.orderLine.garmentDescription ?? null,
        serviceName: task.orderLine.serviceName ?? null,
        serviceCode: task.orderLine.serviceCode ?? null,
        assignmentDate: task.assignmentDate,
        targetQuantity: task.targetQuantity,
        completedQuantity: task.completedQuantity,
        acceptedQuantity: task.acceptedQuantity,
        unitEmployeeRate: rate,
        earnedAmount: roundToCents(task.acceptedQuantity * rate),
        reviewedAt: task.reviewedAt ?? null,
        workerNotes: task.notes ?? null,
        reviewNotes: task.reviewNotes ?? null,
        customerSignatureUrl: task.customerSignatureUrl ?? null,
      };
    });
}

export const mockEarningsApi: EarningsApi = {
  async getSalary(): Promise<SalaryResponseDto> {
    await mockDelay();
    const user = getSessionUser();
    const approved = approvedAssignments();
    const payments = mockPayments();
    const totalEarned = roundToCents(approved.reduce((sum, item) => sum + item.earnedAmount, 0));
    const totalPaid = roundToCents(payments.reduce((sum, item) => sum + item.amount, 0));
    return {
      employee: {
        id: user?.id ?? '',
        userId: user?.employeeId ?? null,
        name: null,
        role: 'EMPLOYEE',
      },
      salarySummary: {
        totalEarned,
        totalPaid,
        remainingBalance: Math.max(0, roundToCents(totalEarned - totalPaid)),
        totalAcceptedGarments: approved.reduce((sum, item) => sum + item.acceptedQuantity, 0),
        paymentCount: payments.length,
        currency: 'LKR',
      },
      acceptedAssignments: approved,
      payments,
    };
  },
};
