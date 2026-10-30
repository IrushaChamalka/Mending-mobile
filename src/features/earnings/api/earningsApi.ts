import { endpoints } from '@/shared/api/endpoints';
import { httpClient } from '@/shared/api/httpClient';

/** Raw earnings calls. Each resolves to the response's `data` payload, which the data layer validates. */
export interface EarningsApi {
  /** GET /api/v1/employee/salary (EMPLOYEE only). */
  getSalary(options?: { signal?: AbortSignal }): Promise<unknown>;
}

export const httpEarningsApi: EarningsApi = {
  getSalary: (options = {}) =>
    httpClient.get(endpoints.earnings.salary, { signal: options.signal }),
};
