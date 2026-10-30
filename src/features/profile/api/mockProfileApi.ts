/** Mock profile api for EXPO_PUBLIC_USE_MOCK_API=true: the signed-in mock account as a profile DTO. */
import { getMockAccount, getSessionUser, type UserRole } from '@/features/auth';
import { endpoints } from '@/shared/api/endpoints';
import { mockApiError, mockDelay } from '@/shared/api/mock';

import { changePasswordFieldErrorMap } from '../data/dto';

import type { ProfileApi } from './profileApi';

const MOCK_CREATED_AT = '2026-10-05T11:00:00.000Z';

function mockProfile(role: UserRole, url: string): unknown {
  const user = getSessionUser();
  const account = user?.employeeId ? getMockAccount(user.employeeId) : undefined;
  if (!account) throw mockApiError(404, 'Employee not found', { method: 'GET', url });
  if (account.role !== role) throw mockApiError(403, 'Forbidden resource', { method: 'GET', url });
  // The backend's shape (API_CONTRACT §4), including fields the app ignores.
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    phone: account.phone,
    role: account.role,
    imageUrl: null,
    age: account.userId === 'user00006' ? 28 : null,
    nic: null,
    gender: account.userId === 'user00006' ? 'Male' : null,
    email: null,
    isActive: account.isActive,
    createdAt: MOCK_CREATED_AT,
    createdBy: null,
  };
}

export const mockProfileApi: ProfileApi = {
  async getEmployeeProfile() {
    await mockDelay();
    return mockProfile('EMPLOYEE', endpoints.profile.employee);
  },
  async getSupervisorProfile() {
    await mockDelay();
    return mockProfile('SUPERVISOR', endpoints.profile.supervisor);
  },
  async changePassword(request) {
    await mockDelay();
    const url = endpoints.profile.employee;
    if (request.password.length < 6) {
      throw mockApiError(
        400,
        ['password must be at least 6 characters'],
        { method: 'PATCH', url },
        {
          fieldErrorMap: changePasswordFieldErrorMap,
        },
      );
    }
    // The backend answers { message, user }; its response interceptor moves `message` into the
    // envelope, so `data` is just the updated user (never the password).
    return { user: mockProfile('EMPLOYEE', url) };
  },
};
