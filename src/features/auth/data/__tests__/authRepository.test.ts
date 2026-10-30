import { authApi } from '../../api';
import { authRepository } from '../authRepository';

jest.mock('../../api', () => ({ authApi: { login: jest.fn() } }));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));

const login = jest.mocked(authApi.login);

describe('authRepository.login', () => {
  afterEach(() => {
    login.mockReset();
  });

  it('sends the normalised identifier and returns the access token', async () => {
    login.mockResolvedValue({
      accessToken: 'header.payload.signature',
      tokenType: 'Bearer',
      expiresIn: '7d',
      user: { id: 'user-uuid', role: 'EMPLOYEE' },
    });

    await expect(
      authRepository.login({ phone: '077 123 4567', password: 'secret1' }),
    ).resolves.toBe('header.payload.signature');
    expect(login).toHaveBeenCalledWith({ phone: '+94771234567', password: 'secret1' });
  });

  it.each(['SUPERVISOR', 'ADMIN', 'SUPERADMIN'])(
    'refuses a %s account before a session starts: the app is for employees',
    async (role) => {
      login.mockResolvedValue({
        accessToken: 'header.payload.signature',
        user: { id: 'user-uuid', role },
      });

      await expect(
        authRepository.login({ phone: '+9876543210', password: 'secret1' }),
      ).rejects.toMatchObject({
        type: 'forbidden',
        isRetryable: false,
        hasFieldErrors: false,
        message: 'This app is for employees. Supervisors and admins use the web dashboard.',
      });
    },
  );

  it('rejects a payload that breaks the contract', async () => {
    login.mockResolvedValue({ token: 'not-the-expected-shape' });

    await expect(
      authRepository.login({ phone: '771234567', password: 'secret1' }),
    ).rejects.toMatchObject({ type: 'server', isRetryable: false });
  });
});
