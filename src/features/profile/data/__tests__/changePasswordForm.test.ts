import { changePasswordFormSchema } from '../changePasswordForm';

function messagesFor(values: { newPassword: string; confirmPassword: string }): string[][] {
  const result = changePasswordFormSchema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.map((issue) => [issue.path.join('.'), issue.message]);
}

describe('changePasswordFormSchema', () => {
  it('requires both fields', () => {
    expect(messagesFor({ newPassword: '', confirmPassword: '' })).toEqual(
      expect.arrayContaining([
        ['newPassword', 'Enter a new password.'],
        ['confirmPassword', 'Confirm your new password.'],
      ]),
    );
  });

  it('mirrors UpdateUserDto: at least 6 characters', () => {
    expect(messagesFor({ newPassword: '12345', confirmPassword: '12345' })).toEqual([
      ['newPassword', 'Password must be at least 6 characters.'],
    ]);
  });

  it('needs the confirmation to match', () => {
    expect(messagesFor({ newPassword: 'secret1', confirmPassword: 'secret2' })).toEqual([
      ['confirmPassword', 'Passwords do not match.'],
    ]);
  });

  it('accepts a matching password, spaces included', () => {
    expect(messagesFor({ newPassword: ' secret 1 ', confirmPassword: ' secret 1 ' })).toEqual([]);
  });
});
