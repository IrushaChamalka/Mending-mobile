import { earningsApi } from '../../api';
import { earningsRepository } from '../earningsRepository';

import { makeSalaryAssignmentDto, makeSalaryPaymentDto } from '../../__fixtures__/salaryFixtures';

jest.mock('@/shared/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));
jest.mock('../../api', () => ({ earningsApi: { getSalary: jest.fn() } }));

const getSalary = jest.mocked(earningsApi.getSalary);

describe('earningsRepository.fetchSalary', () => {
  it('maps the salary payload, keeping calendar days and dropping broken rows', async () => {
    getSalary.mockResolvedValue({
      employee: { id: 'e1', userId: 'user00006', name: 'Kasun Fernando', role: 'EMPLOYEE' },
      salarySummary: {
        totalEarned: 3420,
        totalPaid: 6000,
        remainingBalance: 0,
        totalAcceptedGarments: 190,
        paymentCount: 1,
        currency: 'LKR',
      },
      acceptedAssignments: [makeSalaryAssignmentDto(), { assignmentId: 'broken' }],
      payments: [makeSalaryPaymentDto({ paymentMethod: 'MOBILE_WALLET' })],
    });

    const salary = await earningsRepository.fetchSalary();

    expect(salary.summary).toEqual({
      totalEarned: 3420,
      totalPaid: 6000,
      remainingBalance: 0,
      totalAcceptedGarments: 190,
      currency: 'LKR',
    });
    expect(salary.approved).toEqual([
      {
        assignmentId: 'a1b2c3d4-0000-4000-8000-000000000001',
        orderNumber: 'ORD-2026-0142',
        serviceName: 'Mending',
        date: '2026-10-08',
        acceptedQuantity: 190,
        completedQuantity: 192,
        amount: 3420,
      },
    ]);
    expect(salary.payments[0]).toMatchObject({ paymentNumber: 'SAL-2026-0027', method: 'OTHER' });
  });

  it('rejects a payload without a salary summary', async () => {
    getSalary.mockResolvedValue({ acceptedAssignments: [], payments: [] });
    await expect(earningsRepository.fetchSalary()).rejects.toMatchObject({ type: 'server' });
  });
});
