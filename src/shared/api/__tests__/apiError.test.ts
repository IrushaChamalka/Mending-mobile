import { apiErrorFromResponse, errorTypeForStatus, mapFieldErrors, toApiError } from '../apiError';

const request = { endpoint: '/api/v1/orders/daily-assignments/:id/accept', method: 'PATCH' };

function envelope(status: number, message: string | string[]): Record<string, unknown> {
  return {
    success: false,
    statusCode: status,
    message,
    error: null,
    timestamp: '2026-10-22T00:00:00.000Z',
  };
}

describe('errorTypeForStatus', () => {
  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [408, 'timeout'],
    [409, 'validation'],
    [413, 'validation'],
    [429, 'server'],
    [500, 'server'],
    [503, 'server'],
  ])('maps %i to %s', (status, type) => {
    expect(errorTypeForStatus(status)).toBe(type);
  });
});

describe('apiErrorFromResponse', () => {
  it('shows the login messages verbatim when asked to (they match the design copy)', () => {
    const error = apiErrorFromResponse(401, envelope(401, 'Incorrect mobile number or password.'), {
      ...request,
      useServerMessage: true,
    });
    expect(error.type).toBe('unauthorized');
    expect(error.message).toBe('Incorrect mobile number or password.');
    expect(error.isRetryable).toBe(false);
  });

  it('uses a session-ended message for a 401 outside login', () => {
    const error = apiErrorFromResponse(
      401,
      envelope(401, 'Authentication token is missing or invalid'),
      request,
    );
    expect(error.message).toBe('Your session has ended. Please sign in again.');
    expect(error.serverMessages).toEqual(['Authentication token is missing or invalid']);
  });

  it('turns a single backend 400 message into a sentence', () => {
    const error = apiErrorFromResponse(
      400,
      envelope(400, 'Cannot accept task with status SUBMITTED'),
      request,
    );
    expect(error.type).toBe('validation');
    expect(error.message).toBe('Cannot accept task with status SUBMITTED.');
  });

  it('hides class-validator constraint lists behind a generic message', () => {
    const error = apiErrorFromResponse(
      400,
      envelope(400, ['completedQuantity must be an integer number']),
      request,
    );
    expect(error.message).toBe('Some details are not valid. Please check them and try again.');
    expect(error.serverMessages).toEqual(['completedQuantity must be an integer number']);
  });

  it('maps validation messages onto form fields by prefix', () => {
    const error = apiErrorFromResponse(
      400,
      envelope(400, ['Mobile number is required', 'Password must be at least 6 characters']),
      { ...request, fieldErrorMap: { 'Mobile number': 'phone', Password: 'password' } },
    );
    expect(error.fieldErrors).toEqual({
      phone: 'Mobile number is required',
      password: 'Password must be at least 6 characters',
    });
    expect(error.hasFieldErrors).toBe(true);
    expect(error.message).toBe('Please correct the highlighted fields.');
  });

  it('treats a non-JSON body (proxy error page) like any server fault', () => {
    const error = apiErrorFromResponse(502, '<html>Bad Gateway</html>', request);
    expect(error.type).toBe('server');
    expect(error.isRetryable).toBe(true);
    expect(error.serverMessages).toEqual([]);
  });

  it('keeps the request details for logging', () => {
    const error = apiErrorFromResponse(
      404,
      envelope(404, 'Daily assignment "x" not found'),
      request,
    );
    expect(error).toMatchObject({
      type: 'notFound',
      status: 404,
      method: 'PATCH',
      endpoint: request.endpoint,
    });
  });
});

describe('mapFieldErrors', () => {
  it('keeps the first message per field and ignores unmatched messages', () => {
    expect(
      mapFieldErrors(
        ['Password is required', 'Password must be a string', 'property foo should not exist'],
        {
          Password: 'password',
        },
      ),
    ).toEqual({ password: 'Password is required' });
  });
});

describe('toApiError', () => {
  it('wraps unknown errors as a non-retryable server error', () => {
    const error = toApiError(new TypeError('x is undefined'));
    expect(error.type).toBe('server');
    expect(error.isRetryable).toBe(false);
  });
});
