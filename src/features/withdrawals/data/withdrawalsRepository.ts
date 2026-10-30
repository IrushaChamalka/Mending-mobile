import { endpoints } from '@/shared/api/endpoints';
import { parseItems, parseResponse } from '@/shared/api/parseResponse';

import { withdrawalsApi } from '../api';
import type { PayoutAccount, Withdrawal } from '../types';

import { payoutAccountSchema, withdrawalListSchema, withdrawalSchema } from './dto';
import { toPayoutAccount, toWithdrawal } from './withdrawalMapper';

export const withdrawalsRepository = {
  /** The employee's payout requests (proposed endpoint; mock only today). */
  async fetchWithdrawals(signal?: AbortSignal): Promise<Withdrawal[]> {
    const url = endpoints.proposed.withdrawals;
    const response = parseResponse(
      withdrawalListSchema,
      await withdrawalsApi.listWithdrawals({ signal }),
      url,
    );
    return parseItems(withdrawalSchema, response.withdrawals, url).map(toWithdrawal);
  },

  /** Requests a payout to the given account. Rejects with ApiError. */
  async createWithdrawal(amount: number, payoutAccountId: string): Promise<Withdrawal> {
    const url = endpoints.proposed.withdrawals;
    const payload = await withdrawalsApi.createWithdrawal({ amount, payoutAccountId });
    return toWithdrawal(parseResponse(withdrawalSchema, payload, url));
  },

  /** The account payouts go to (proposed endpoint; mock only today). */
  async fetchPayoutAccount(signal?: AbortSignal): Promise<PayoutAccount> {
    const url = endpoints.proposed.payoutAccount;
    const payload = await withdrawalsApi.getPayoutAccount({ signal });
    return toPayoutAccount(parseResponse(payoutAccountSchema, payload, url));
  },
};
