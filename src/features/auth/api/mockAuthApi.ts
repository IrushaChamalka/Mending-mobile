/**
 * Mock auth api for EXPO_PUBLIC_USE_MOCK_API=true. Accounts mirror the backend seed (prisma/seed.ts)
 * plus the design's sample number. Any password of 6 or more characters signs in an active account.
 * The real seed password is deliberately not copied here.
 *
 * | Type after +94       | Account                           | Result            |
 * | -------------------- | --------------------------------- | ----------------- |
 * | 77 123 4567          | Kasun Fernando, user00006         | signs in          |
 * | 71 234 5671          | Kamal Perera, user00003           | signs in          |
 * | 71 234 5672          | Nimal Silva, user00004            | signs in          |
 * | 71 234 5673          | Sunethra Bandara, user00005       | inactive account  |
 * | +9876543210 (with +) | Jane Smith, user00001, SUPERVISOR | employees only    |
 * | anything else        | -                                 | incorrect details |
 *
 * The supervisor gets a token like the backend would give; the app itself refuses it (authRepository).
 */
import { endpoints } from '@/shared/api/endpoints';
import { mockApiError, mockDelay } from '@/shared/api/mock';
import { COUNTRY_DIAL_CODE } from '@/shared/config/locale';
import { encodeBase64Url } from '@/shared/utils/base64';

import {
  loginFieldErrorMap,
  type LoginUserDto,
  type MobileLoginRequestDto,
  type MobileLoginResponseDto,
} from '../data/dto';
import type { UserRole } from '../types';

import type { AuthApi } from './authApi';

export interface MockAccount {
  id: string;
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

const MOCK_ADMIN_ID = '3c1e6f0a-9b2d-4e57-8a61-0f4d2c7b9e13';
const MOCK_CREATED_AT = '2026-10-05T11:00:00.000Z';
const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

const MOCK_ACCOUNTS: readonly MockAccount[] = [
  {
    id: 'e0f76534-2109-4d45-a4aa-3456789012de',
    userId: 'user00006',
    name: 'Kasun Fernando',
    phone: '+94771234567',
    role: 'EMPLOYEE',
    isActive: true,
  },
  {
    id: '6a2b9c1d-3e4f-4a5b-8c6d-7e8f9a0b1c22',
    userId: 'user00003',
    name: 'Kamal Perera',
    phone: '+94712345671',
    role: 'EMPLOYEE',
    isActive: true,
  },
  {
    id: '7b3c0d2e-4f5a-4b6c-9d7e-8f9a0b1c2d33',
    userId: 'user00004',
    name: 'Nimal Silva',
    phone: '+94712345672',
    role: 'EMPLOYEE',
    isActive: true,
  },
  {
    id: '8c4d1e3f-5a6b-4c7d-ae8f-9a0b1c2d3e44',
    userId: 'user00005',
    name: 'Sunethra Bandara (Inactive)',
    phone: '+94712345673',
    role: 'EMPLOYEE',
    isActive: false,
  },
  {
    id: '5f1a8b0c-2d3e-4f4a-9b5c-6d7e8f9a0b11',
    userId: 'user00001',
    name: 'Jane Smith',
    phone: '+9876543210',
    role: 'SUPERVISOR',
    isActive: true,
  },
];

/** The mock account with this employee ID, for other features' mock apis (the profile). */
export function getMockAccount(userId: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((account) => account.userId === userId);
}

const LOGIN_REQUEST = { method: 'POST', url: endpoints.auth.mobileLogin };
const LOGIN_ERROR_OPTIONS = { useServerMessage: true, fieldErrorMap: loginFieldErrorMap };

/** The phone variants the backend tries for one identifier (AuthService.loginMobile). */
function phoneVariants(identifier: string): string[] {
  const dialDigits = COUNTRY_DIAL_CODE.slice(1);
  if (identifier.startsWith(COUNTRY_DIAL_CODE)) {
    const national = identifier.slice(COUNTRY_DIAL_CODE.length);
    return [identifier, `0${national}`, national];
  }
  if (identifier.startsWith('0')) {
    const national = identifier.slice(1);
    return [identifier, `${COUNTRY_DIAL_CODE}${national}`, national];
  }
  return [identifier, `+${dialDigits}${identifier}`, `0${identifier}`];
}

function compactIdentifier(identifier: string): string {
  return identifier.trim().replace(/\s+/g, '');
}

/** The mock account with this mobile number, matched in any of the backend's forms (the password reset). */
export function findMockAccountByPhone(phone: string): MockAccount | undefined {
  const variants = phoneVariants(compactIdentifier(phone));
  return MOCK_ACCOUNTS.find((account) => variants.includes(account.phone));
}

function findAccount(phoneOrUserId: string): MockAccount | undefined {
  const identifier = compactIdentifier(phoneOrUserId);
  return (
    findMockAccountByPhone(identifier) ??
    MOCK_ACCOUNTS.find((account) => account.userId === identifier)
  );
}

/** An unsigned token with the claims the backend signs, so the session code can read it. */
function createMockAccessToken(account: MockAccount): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: account.id,
      role: account.role,
      userId: account.userId,
      phone: account.phone,
      iat: issuedAt,
      exp: issuedAt + TOKEN_LIFETIME_SECONDS,
    }),
  );
  return `${header}.${payload}.mock-signature`;
}

function toUserDto(account: MockAccount): LoginUserDto {
  return {
    id: account.id,
    userId: account.userId,
    role: account.role,
    name: account.name,
    phone: account.phone,
    imageUrl: null,
    age: null,
    nic: null,
    gender: null,
    isActive: account.isActive,
    email: null,
    createdById: MOCK_ADMIN_ID,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    userType: 'STAFF',
  };
}

export const mockAuthApi: AuthApi = {
  async login(request: MobileLoginRequestDto): Promise<MobileLoginResponseDto> {
    await mockDelay();
    if (request.password.length < 6) {
      throw mockApiError(
        400,
        ['Password must be at least 6 characters'],
        LOGIN_REQUEST,
        LOGIN_ERROR_OPTIONS,
      );
    }
    const account = findAccount(request.phone);
    if (!account) {
      throw mockApiError(
        401,
        'Incorrect mobile number or password.',
        LOGIN_REQUEST,
        LOGIN_ERROR_OPTIONS,
      );
    }
    if (!account.isActive) {
      throw mockApiError(
        401,
        'Your account is inactive. Please contact your supervisor.',
        LOGIN_REQUEST,
        LOGIN_ERROR_OPTIONS,
      );
    }
    return {
      accessToken: createMockAccessToken(account),
      tokenType: 'Bearer',
      expiresIn: '7d',
      user: toUserDto(account),
    };
  },
};
