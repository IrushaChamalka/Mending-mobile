import { roleLabel, signOutWarning } from '../profileRules';

describe('roleLabel', () => {
  it('names each role for people', () => {
    expect(roleLabel('EMPLOYEE')).toBe('Employee');
    expect(roleLabel('SUPERVISOR')).toBe('Supervisor');
    expect(roleLabel('SUPERADMIN')).toBe('Super admin');
  });
});

describe('signOutWarning', () => {
  it('has nothing to say when nothing would be lost', () => {
    expect(signOutWarning({ submissions: 0, accepts: 0 })).toBeNull();
  });

  it('warns about one submission', () => {
    expect(signOutWarning({ submissions: 1, accepts: 0 })).toBe(
      "1 submission hasn't reached the server yet. Signing out now deletes it from this phone.",
    );
  });

  it('warns about submissions and offline accepts together', () => {
    expect(signOutWarning({ submissions: 2, accepts: 1 })).toBe(
      "2 submissions and 1 task acceptance haven't reached the server yet. Signing out now deletes them from this phone.",
    );
  });

  it('warns about accepts alone', () => {
    expect(signOutWarning({ submissions: 0, accepts: 2 })).toBe(
      "2 task acceptances haven't reached the server yet. Signing out now deletes them from this phone.",
    );
  });
});
