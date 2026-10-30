import { env } from './env';

/**
 * Designed features the backend does not support yet (API_CONTRACT §9). Each is built against its
 * mock api and shown only in mock mode, so a tester using the real backend never sends a request
 * that nothing receives. When the backend ships an endpoint, add the http api and turn the flag on.
 */
export interface FeatureFlags {
  /** Forgot password → code by SMS → new password (E 1.4–1.6). */
  passwordReset: boolean;
  /** Request a payout, review it, and see it pending (E 5.1–5.4). */
  withdrawalRequests: boolean;
  /** The bank account payouts go to (E 5.1 "Payout to", E 6.1 "Payout account"). */
  payoutAccount: boolean;
}

export const features: FeatureFlags = {
  passwordReset: env.useMockApi,
  withdrawalRequests: env.useMockApi,
  payoutAccount: env.useMockApi,
};
