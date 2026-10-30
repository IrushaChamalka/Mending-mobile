import { isApiError } from '@/shared/api/apiError';

import { profileApi } from '../../api';
import { profileRepository } from '../profileRepository';

jest.mock('../../api', () => ({
  profileApi: { getEmployeeProfile: jest.fn(), getSupervisorProfile: jest.fn() },
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));

const getEmployeeProfile = jest.mocked(profileApi.getEmployeeProfile);
const getSupervisorProfile = jest.mocked(profileApi.getSupervisorProfile);

describe('profileRepository', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("reads an employee's profile from the employee endpoint", async () => {
    getEmployeeProfile.mockResolvedValue({ id: 'id-1', userId: 'user00006', name: 'Kasun' });

    const profile = await profileRepository.fetchProfile('EMPLOYEE');

    expect(profile?.name).toBe('Kasun');
    expect(getSupervisorProfile).not.toHaveBeenCalled();
  });

  it("reads a supervisor's profile from the supervisor endpoint", async () => {
    getSupervisorProfile.mockResolvedValue({ id: 'id-2', userId: 'user00002', name: 'Dilani' });

    await expect(profileRepository.fetchProfile('SUPERVISOR')).resolves.toMatchObject({
      name: 'Dilani',
    });
  });

  it('has no profile for admin accounts (API_CONTRACT Gap 3)', async () => {
    await expect(profileRepository.fetchProfile('ADMIN')).resolves.toBeNull();
    expect(getEmployeeProfile).not.toHaveBeenCalled();
  });

  it('rejects a payload that breaks the contract as a non-retryable error', async () => {
    getEmployeeProfile.mockResolvedValue({ name: 'No id' });

    const error: unknown = await profileRepository
      .fetchProfile('EMPLOYEE')
      .catch((caught: unknown) => caught);

    expect(isApiError(error) && error.isRetryable).toBe(false);
  });
});
