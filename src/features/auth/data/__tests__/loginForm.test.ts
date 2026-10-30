import { loginFormSchema } from '../loginForm';

function messagesFor(values: { phone: string; password: string }): string[][] {
  const result = loginFormSchema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.map((issue) => [issue.path.join('.'), issue.message]);
}

describe('loginFormSchema', () => {
  it('requires both fields', () => {
    expect(messagesFor({ phone: '   ', password: '' })).toEqual(
      expect.arrayContaining([
        ['phone', 'Enter your mobile number.'],
        ['password', 'Enter your password.'],
      ]),
    );
  });

  it('mirrors the backend minimum password length', () => {
    expect(messagesFor({ phone: '771234567', password: '12345' })).toEqual([
      ['password', 'Password must be at least 6 characters.'],
    ]);
  });

  it('accepts valid credentials and trims the identifier', () => {
    expect(loginFormSchema.parse({ phone: ' 77 123 4567 ', password: 'secret1' })).toEqual({
      phone: '77 123 4567',
      password: 'secret1',
    });
  });
});
