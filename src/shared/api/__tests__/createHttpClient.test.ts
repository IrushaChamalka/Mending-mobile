import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { ApiError } from '../apiError';
import { createHttpClient, type HttpAuthBridge } from '../createHttpClient';

type Outcome = { status: number; body?: unknown } | 'network' | 'timeout';

function fakeServer(respond: (config: InternalAxiosRequestConfig) => Outcome): {
  adapter: AxiosAdapter;
  requests: InternalAxiosRequestConfig[];
} {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = (config) => {
    requests.push(config);
    const outcome = respond(config);
    if (outcome === 'network') {
      return Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));
    }
    if (outcome === 'timeout') {
      return Promise.reject(new AxiosError('timeout exceeded', AxiosError.ECONNABORTED, config));
    }
    const response: AxiosResponse = {
      data: outcome.body,
      status: outcome.status,
      statusText: '',
      headers: new AxiosHeaders(),
      config,
    };
    if (outcome.status >= 400) {
      return Promise.reject(
        new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response),
      );
    }
    return Promise.resolve(response);
  };
  return { adapter, requests };
}

const ok = (data: unknown): Outcome => ({
  status: 200,
  body: { success: true, statusCode: 200, message: 'Success', data, timestamp: 'now' },
});

const failure = (status: number, message: string | string[]): Outcome => ({
  status,
  body: { success: false, statusCode: status, message, error: null, timestamp: 'now' },
});

function authHeader(config: InternalAxiosRequestConfig | undefined): unknown {
  return config?.headers.get('Authorization');
}

function bridgeWithToken(initial: string | null): HttpAuthBridge & {
  setToken(token: string | null): void;
  refreshAccessToken: jest.Mock<Promise<string | null>, []>;
  onSessionExpired: jest.Mock<void, []>;
} {
  let token = initial;
  return {
    getAccessToken: () => token,
    setToken: (next) => {
      token = next;
    },
    refreshAccessToken: jest.fn(() => Promise.resolve(null)),
    onSessionExpired: jest.fn(() => {
      token = null;
    }),
  };
}

describe('createHttpClient', () => {
  it('sends the bearer token and resolves to the envelope data', async () => {
    const server = fakeServer(() => ok({ tasks: [] }));
    const bridge = bridgeWithToken('T1');
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => bridge,
    });

    await expect(client.get('/api/v1/orders/my-tasks')).resolves.toEqual({ tasks: [] });
    expect(authHeader(server.requests[0])).toBe('Bearer T1');
  });

  it('omits the token when skipAuth is set', async () => {
    const server = fakeServer(() => ok({ accessToken: 'x' }));
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => bridgeWithToken('T1'),
    });

    await client.post('/api/v1/auth/mobile/login', { phone: '+94771234567' }, { skipAuth: true });
    expect(authHeader(server.requests[0])).toBeUndefined();
  });

  it('rejects a 2xx body that is not the backend envelope', async () => {
    const server = fakeServer(() => ({ status: 200, body: 'Hello World!' }));
    const onError = jest.fn();
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => null,
      onError,
    });

    const error: unknown = await client.get('/').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ type: 'server', isRetryable: false });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('normalises network failures and timeouts', async () => {
    const outcomes: Outcome[] = ['network', 'timeout'];
    const server = fakeServer(() => outcomes.shift() ?? 'network');
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => null,
    });

    await expect(client.get('/a')).rejects.toMatchObject({ type: 'network', isRetryable: true });
    await expect(client.get('/b')).rejects.toMatchObject({ type: 'timeout', isRetryable: true });
  });

  it('maps validation messages to fields through fieldErrorMap', async () => {
    const server = fakeServer(() => failure(400, ['Password must be at least 6 characters']));
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => null,
    });

    await expect(
      client.post('/login', {}, { skipAuth: true, fieldErrorMap: { Password: 'password' } }),
    ).rejects.toMatchObject({
      type: 'validation',
      fieldErrors: { password: 'Password must be at least 6 characters' },
    });
  });

  it('ends the session once when concurrent requests get 401 and renewal is unavailable', async () => {
    const server = fakeServer(() => failure(401, 'Authentication token is missing or invalid'));
    const bridge = bridgeWithToken('T1');
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => bridge,
    });

    const results = await Promise.allSettled([client.get('/a'), client.get('/b')]);

    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
    expect(bridge.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(bridge.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(server.requests).toHaveLength(2);
  });

  it('retries once with the renewed token', async () => {
    const bridge = bridgeWithToken('T1');
    bridge.refreshAccessToken.mockImplementation(() => {
      bridge.setToken('T2');
      return Promise.resolve('T2');
    });
    const server = fakeServer((config) =>
      authHeader(config) === 'Bearer T2' ? ok('done') : failure(401, 'expired'),
    );
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => bridge,
    });

    await expect(client.get('/a')).resolves.toBe('done');
    expect(server.requests.map(authHeader)).toEqual(['Bearer T1', 'Bearer T2']);
    expect(bridge.onSessionExpired).not.toHaveBeenCalled();
  });

  it('never ends the session for a 401 on a request sent without a token (login)', async () => {
    const server = fakeServer(() => failure(401, 'Incorrect mobile number or password.'));
    const bridge = bridgeWithToken('T1');
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => bridge,
    });

    await expect(
      client.post('/api/v1/auth/mobile/login', {}, { skipAuth: true, useServerMessage: true }),
    ).rejects.toMatchObject({
      type: 'unauthorized',
      message: 'Incorrect mobile number or password.',
    });
    expect(bridge.onSessionExpired).not.toHaveBeenCalled();
  });

  it('retries with the current token when the session changed while the request was in flight', async () => {
    const bridge = bridgeWithToken('T1');
    const server = fakeServer((config) => {
      if (authHeader(config) === 'Bearer T1') {
        bridge.setToken('T2'); // A new sign-in finished meanwhile.
        return failure(401, 'expired');
      }
      return ok('fresh');
    });
    const client = createHttpClient({
      baseURL: 'https://api.test',
      adapter: server.adapter,
      getAuthBridge: () => bridge,
    });

    await expect(client.get('/a')).resolves.toBe('fresh');
    expect(bridge.refreshAccessToken).not.toHaveBeenCalled();
    expect(bridge.onSessionExpired).not.toHaveBeenCalled();
  });
});
