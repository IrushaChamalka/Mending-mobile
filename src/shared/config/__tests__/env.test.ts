import { parseEnv, type RawEnv } from '../env';

function raw(overrides: Partial<RawEnv> = {}): RawEnv {
  return {
    apiUrl: 'http://localhost:3000',
    useMockApi: undefined,
    sentryDsn: undefined,
    sentryEnableInDev: undefined,
    appEnv: undefined,
    ...overrides,
  };
}

describe('parseEnv', () => {
  it.each([
    'http://localhost:3000',
    'http://10.0.2.2:3000',
    'http://192.168.1.20:3000',
    'http://my-mac.local:3000',
  ])('accepts the local backend %s in development', (apiUrl) => {
    expect(parseEnv(raw({ apiUrl })).apiUrl).toBe(apiUrl);
  });

  it('drops trailing slashes from the API URL', () => {
    expect(parseEnv(raw({ apiUrl: 'https://api.example.com//' })).apiUrl).toBe(
      'https://api.example.com',
    );
  });

  it.each([undefined, '', 'localhost:3000', 'ftp://files.example.com', 'http://'])(
    'rejects %p as the API URL',
    (apiUrl) => {
      expect(() => parseEnv(raw({ apiUrl }))).toThrow(
        'EXPO_PUBLIC_API_URL must be an absolute http(s) URL',
      );
    },
  );

  it('requires https outside development (API_CONTRACT Gap 17)', () => {
    expect(() => parseEnv(raw({ appEnv: 'production' }))).toThrow(
      'EXPO_PUBLIC_API_URL must use https:// in preview and production builds',
    );
    expect(parseEnv(raw({ apiUrl: 'https://api.example.com', appEnv: 'preview' })).appEnv).toBe(
      'preview',
    );
  });

  it('reads the switches and defaults them to off', () => {
    expect(parseEnv(raw())).toEqual({
      apiUrl: 'http://localhost:3000',
      useMockApi: false,
      sentryDsn: undefined,
      sentryEnableInDev: false,
      appEnv: 'development',
    });
    expect(parseEnv(raw({ useMockApi: 'true', sentryEnableInDev: 'true' }))).toMatchObject({
      useMockApi: true,
      sentryEnableInDev: true,
    });
  });

  it('treats an empty Sentry DSN as no DSN', () => {
    expect(parseEnv(raw({ sentryDsn: '   ' })).sentryDsn).toBeUndefined();
  });

  it('rejects an unknown app environment', () => {
    expect(() => parseEnv(raw({ appEnv: 'staging' }))).toThrow('appEnv');
  });
});
