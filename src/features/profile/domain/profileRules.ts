import type { UserRole } from '@/features/auth';

const ROLE_LABELS: Readonly<Record<UserRole, string>> = {
  EMPLOYEE: 'Employee',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Admin',
  SUPERADMIN: 'Super admin',
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

/** Work that exists only on this phone and that signing out would delete. */
export interface UnsentWork {
  /** Queued, uploading or failed submissions. */
  submissions: number;
  /** Accepts made offline that have not reached the server. */
  accepts: number;
}

function countOf(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * The warning shown before signing out (brief §13), or null when nothing would be lost. Sign-out
 * deletes the user's queued submissions and clears the cache that holds offline accepts.
 */
export function signOutWarning(work: UnsentWork): string | null {
  const parts: string[] = [];
  if (work.submissions > 0) parts.push(countOf(work.submissions, 'submission', 'submissions'));
  if (work.accepts > 0) parts.push(countOf(work.accepts, 'task acceptance', 'task acceptances'));
  if (parts.length === 0) return null;
  const isOne = work.submissions + work.accepts === 1;
  return `${parts.join(' and ')} ${isOne ? "hasn't" : "haven't"} reached the server yet. Signing out now deletes ${isOne ? 'it' : 'them'} from this phone.`;
}
