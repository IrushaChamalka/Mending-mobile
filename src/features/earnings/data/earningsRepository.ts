import { endpoints } from '@/shared/api/endpoints';
import { parseItems, parseResponse } from '@/shared/api/parseResponse';

import { earningsApi } from '../api';
import type { Salary } from '../types';

import { salaryAssignmentSchema, salaryPaymentSchema, salaryResponseSchema } from './dto';
import { toApprovedEarning, toSalaryPayment } from './salaryMapper';

export const earningsRepository = {
  /** The signed-in employee's approved earnings and recorded payouts, all time. */
  async fetchSalary(signal?: AbortSignal): Promise<Salary> {
    const url = endpoints.earnings.salary;
    const response = parseResponse(
      salaryResponseSchema,
      await earningsApi.getSalary({ signal }),
      url,
    );
    const { salarySummary } = response;
    return {
      summary: {
        totalEarned: salarySummary.totalEarned,
        totalPaid: salarySummary.totalPaid,
        remainingBalance: salarySummary.remainingBalance,
        totalAcceptedGarments: salarySummary.totalAcceptedGarments,
        currency: salarySummary.currency,
      },
      approved: parseItems(salaryAssignmentSchema, response.acceptedAssignments, url).map(
        toApprovedEarning,
      ),
      payments: parseItems(salaryPaymentSchema, response.payments, url).map(toSalaryPayment),
    };
  },
};
