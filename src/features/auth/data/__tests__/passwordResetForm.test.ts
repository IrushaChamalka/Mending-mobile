import { forgotPasswordFormSchema, newPasswordFormSchema } from '../passwordResetForm';

function issues(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}): string[][] {
  return result.error
    ? result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
    : [];
}

describe('forgotPasswordFormSchema', () => {
  it('requires a number', () => {
    expect(issues(forgotPasswordFormSchema.safeParse({ phone: '  ' }))).toEqual([
      ['phone', 'Enter your mobile number.'],
    ]);
  });

  it.each(['user00006', 'kasun@example.com'])('rejects %p: the code goes out by SMS', (phone) => {
    expect(issues(forgotPasswordFormSchema.safeParse({ phone }))).toEqual([
      ['phone', 'Enter a valid mobile number.'],
    ]);
  });

  it.each(['77 123 4567', '0771234567', '+1234567890'])('accepts %p', (phone) => {
    expect(forgotPasswordFormSchema.safeParse({ phone }).success).toBe(true);
  });
});

describe('newPasswordFormSchema', () => {
  it('requires both fields', () => {
    expect(
      issues(newPasswordFormSchema.safeParse({ newPassword: '', confirmPassword: '' })),
    ).toEqual(
      expect.arrayContaining([
        ['newPassword', 'Enter a new password.'],
        ['confirmPassword', 'Confirm your new password.'],
      ]),
    );
  });

  it('mirrors the backend minimum length', () => {
    expect(
      issues(newPasswordFormSchema.safeParse({ newPassword: '12345', confirmPassword: '12345' })),
    ).toEqual([['newPassword', 'Password must be at least 6 characters.']]);
  });

  it('needs the confirmation to match', () => {
    expect(
      issues(
        newPasswordFormSchema.safeParse({
          newPassword: 'Kasun@2026',
          confirmPassword: 'Kasun@2025',
        }),
      ),
    ).toEqual([['confirmPassword', 'Passwords do not match.']]);
  });

  it('accepts a matching password of 6 or more characters', () => {
    expect(
      newPasswordFormSchema.safeParse({ newPassword: 'secret1', confirmPassword: 'secret1' })
        .success,
    ).toBe(true);
  });
});
