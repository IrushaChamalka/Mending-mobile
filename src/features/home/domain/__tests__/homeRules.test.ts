import { balanceBreakdown, greetingFor } from '../homeRules';

describe('greetingFor', () => {
  it.each([
    [6, 'Good morning,'],
    [11, 'Good morning,'],
    [12, 'Good afternoon,'],
    [16, 'Good afternoon,'],
    [17, 'Good evening,'],
    [23, 'Good evening,'],
  ])('at %i:00 says %s', (hour, greeting) => {
    expect(greetingFor(hour)).toBe(greeting);
  });
});

describe('balanceBreakdown', () => {
  it('reads like the design (E 2.1)', () => {
    expect(balanceBreakdown({ approved: 25560, withdrawn: 10000, pending: 0 })).toBe(
      'Approved 25,560 – withdrawn 10,000',
    );
  });

  it('names a held request so the numbers add up', () => {
    expect(balanceBreakdown({ approved: 25560, withdrawn: 10000, pending: 5000 })).toBe(
      'Approved 25,560 – withdrawn 10,000 – pending 5,000',
    );
  });
});
