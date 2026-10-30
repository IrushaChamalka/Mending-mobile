/**
 * Every backend path the app calls, matching docs/API_CONTRACT.md (backend branch
 * feature/tecnyne-10-14-2026-TEC9-91). Add new paths here, never inline in feature code.
 *
 * `proposed` paths do not exist on the backend yet (API_CONTRACT §9). Only the mock apis answer them,
 * and the screens that use them are hidden by `shared/config/features` against the real backend.
 */
const API = '/api/v1';

function dailyAssignment(assignmentId: string): string {
  return `${API}/orders/daily-assignments/${encodeURIComponent(assignmentId)}`;
}

export const endpoints = {
  auth: {
    mobileLogin: `${API}/auth/mobile/login`,
  },
  profile: {
    employee: `${API}/employee/profile`,
    supervisor: `${API}/supervisor/profile`,
  },
  tasks: {
    myTasks: `${API}/orders/my-tasks`,
    accept: (assignmentId: string): string => `${dailyAssignment(assignmentId)}/accept`,
  },
  submission: {
    uploadPhoto: (assignmentId: string): string => `${dailyAssignment(assignmentId)}/signature`,
    submitWork: (assignmentId: string): string => `${dailyAssignment(assignmentId)}/submit-work`,
  },
  earnings: {
    salary: `${API}/employee/salary`,
  },
  proposed: {
    passwordResetRequest: `${API}/auth/mobile/password-reset/request`,
    passwordResetVerify: `${API}/auth/mobile/password-reset/verify`,
    passwordResetComplete: `${API}/auth/mobile/password-reset/complete`,
    withdrawals: `${API}/employee/withdrawals`,
    payoutAccount: `${API}/employee/payout-account`,
  },
} as const;

const UUID_SEGMENT = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi;

/** "/api/v1/orders/daily-assignments/<uuid>/accept?x=1" → "/api/v1/orders/daily-assignments/:id/accept". */
export function toEndpointTemplate(url: string): string {
  const path = url.split('?')[0] ?? url;
  return path.replace(UUID_SEGMENT, '/:id');
}
