import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { earningsRepository } from '../data/earningsRepository';
import { earningsKeys } from '../data/queryKeys';
import type { Salary } from '../types';

/** Salary data changes only when a supervisor reviews work or an admin records a payout. */
const SALARY_STALE_TIME_MS = 2 * 60 * 1000;

/** The signed-in employee's earnings and payouts (GET /employee/salary). */
export function useSalaryQuery(): UseQueryResult<Salary, Error> {
  return useQuery({
    queryKey: earningsKeys.salary(),
    queryFn: ({ signal }) => earningsRepository.fetchSalary(signal),
    staleTime: SALARY_STALE_TIME_MS,
  });
}
