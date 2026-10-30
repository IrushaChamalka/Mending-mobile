/**
 * The app is for employees only: the profile, earnings and withdrawal endpoints accept the EMPLOYEE
 * role alone (API_CONTRACT §3.4), so any other account would sign in to an app that cannot load.
 */
export function canUseEmployeeApp(role: string): boolean {
  return role === 'EMPLOYEE';
}

/** Shown in the sign-in alert when a supervisor or admin signs in. */
export const EMPLOYEES_ONLY_MESSAGE =
  'This app is for employees. Supervisors and admins use the web dashboard.';
