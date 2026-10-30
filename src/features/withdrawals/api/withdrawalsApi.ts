import { endpoints } from '@/shared/api/endpoints';
import { httpClient } from '@/shared/api/httpClient';

import type { CreateWithdrawalRequestDto } from '../data/dto';

/**
 * Raw withdrawal calls. Each resolves to the response's `data` payload, which the data layer
 * validates. The paths are proposals (API_CONTRACT Gaps 22–23): only the mock answers them today,
 * and the screens that call them are hidden against the real backend by `shared/config/features`.
 */
export interface WithdrawalsApi {
  /** GET /api/v1/employee/withdrawals (proposed). */
  listWithdrawals(options?: { signal?: AbortSignal }): Promise<unknown>;
  /** POST /api/v1/employee/withdrawals (proposed). */
  createWithdrawal(request: CreateWithdrawalRequestDto): Promise<unknown>;
  /** GET /api/v1/employee/payout-account (proposed). */
  getPayoutAccount(options?: { signal?: AbortSignal }): Promise<unknown>;
}

export const httpWithdrawalsApi: WithdrawalsApi = {
  listWithdrawals: (options = {}) =>
    httpClient.get(endpoints.proposed.withdrawals, { signal: options.signal }),
  createWithdrawal: (request) => httpClient.post(endpoints.proposed.withdrawals, request),
  getPayoutAccount: (options = {}) =>
    httpClient.get(endpoints.proposed.payoutAccount, { signal: options.signal }),
};
