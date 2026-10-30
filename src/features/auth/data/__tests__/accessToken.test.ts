import { decodeAccessToken, toSessionUser } from '../accessToken';

function base64Url(value: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function jwt(payload: Record<string, unknown>): string {
  return [
    base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    base64Url(JSON.stringify(payload)),
    'signature',
  ].join('.');
}

const employeeClaims = {
  sub: 'e0f76534-2109-4d45-c4aa-3456789012de',
  role: 'EMPLOYEE',
  userId: 'user00002',
  phone: '+94771234567',
  iat: 1_760_000_000,
  exp: 1_760_604_800,
};

describe('decodeAccessToken', () => {
  it('reads the claims the backend signs', () => {
    expect(decodeAccessToken(jwt(employeeClaims))).toMatchObject({
      sub: employeeClaims.sub,
      role: 'EMPLOYEE',
      userId: 'user00002',
      exp: employeeClaims.exp,
    });
  });

  it('decodes UTF-8 payloads', () => {
    const claims = decodeAccessToken(jwt({ ...employeeClaims, userName: 'Dilāni Silva' }));
    expect(claims?.sub).toBe(employeeClaims.sub);
  });

  it.each([
    ['an empty string', ''],
    ['two segments', 'a.b'],
    ['a payload that is not base64 JSON', 'a.%%%.c'],
    ['an unknown role', jwt({ ...employeeClaims, role: 'GUEST' })],
    ['a missing subject', jwt({ role: 'EMPLOYEE' })],
  ])('returns null for %s', (_label, token) => {
    expect(decodeAccessToken(token)).toBeNull();
  });
});

describe('toSessionUser', () => {
  it('uses userId as the employee ID', () => {
    const claims = decodeAccessToken(jwt(employeeClaims));
    expect(claims && toSessionUser(claims)).toEqual({
      id: employeeClaims.sub,
      employeeId: 'user00002',
      role: 'EMPLOYEE',
      phone: '+94771234567',
    });
  });

  it('falls back to adminId for admin accounts', () => {
    const claims = decodeAccessToken(
      jwt({ sub: 'admin-uuid', role: 'ADMIN', adminId: 'admin00001' }),
    );
    expect(claims && toSessionUser(claims)).toMatchObject({
      employeeId: 'admin00001',
      phone: null,
    });
  });
});
