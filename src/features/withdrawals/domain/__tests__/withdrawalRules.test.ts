import { makeWithdrawal } from '../../__fixtures__/withdrawalFixtures';
import {
  availableToWithdraw,
  balanceAfterWithdrawal,
  formatAccountLong,
  formatAccountShort,
  formatShortReference,
  maskAccountNumber,
  matchesWithdrawalFilter,
  paidTotal,
  pendingTotal,
  quickAmountsFor,
  sortWithdrawals,
  validateWithdrawalAmount,
} from '../withdrawalRules';

const history = [
  makeWithdrawal({ id: 'pending', status: 'pending', amount: 10000, date: '2026-10-09' }),
  makeWithdrawal({ id: 'paid-1', status: 'paid', amount: 6000, date: '2026-09-28' }),
  makeWithdrawal({ id: 'paid-2', status: 'paid', amount: 4000.1, date: '2026-09-15' }),
  makeWithdrawal({ id: 'rejected', status: 'rejected', amount: 12000, date: '2026-09-02' }),
];

describe('account labels', () => {
  it('formats the account as designed', () => {
    const account = { bankName: 'Bank of Ceylon', bankCode: 'BOC', last4: '4421' };
    expect(formatAccountShort(account)).toBe('BOC ···· 4421');
    expect(formatAccountLong(account)).toBe('Bank of Ceylon ···· 4421');
    expect(maskAccountNumber('4421')).toBe('···· 4421');
  });
});

describe('totals', () => {
  it('sums pending and paid payouts separately, to the cent', () => {
    expect(pendingTotal(history)).toBe(10000);
    expect(paidTotal(history)).toBe(10000.1);
    expect(
      paidTotal([
        makeWithdrawal({ status: 'paid', amount: 0.1 }),
        makeWithdrawal({ status: 'paid', amount: 0.2 }),
      ]),
    ).toBe(0.3);
  });

  it('is zero with nothing to count', () => {
    expect(pendingTotal([])).toBe(0);
    expect(paidTotal([makeWithdrawal({ status: 'rejected' })])).toBe(0);
  });
});

describe('availableToWithdraw', () => {
  it('holds pending requests back from the unpaid balance', () => {
    expect(availableToWithdraw(15560, 0)).toBe(15560);
    expect(availableToWithdraw(15560, 10000)).toBe(5560);
  });

  it('never goes below zero', () => {
    expect(availableToWithdraw(4000, 10000)).toBe(0);
  });
});

describe('balanceAfterWithdrawal', () => {
  it('is what stays available once the request is held (E 5.3)', () => {
    expect(balanceAfterWithdrawal(15560, 10000)).toBe(5560);
    expect(balanceAfterWithdrawal(15560, 15560)).toBe(0);
    expect(balanceAfterWithdrawal(100.3, 0.1)).toBe(100.2);
  });
});

describe('validateWithdrawalAmount', () => {
  it('asks for an amount', () => {
    expect(validateWithdrawalAmount(null, 15560)).toBe('Enter an amount.');
    expect(validateWithdrawalAmount(0, 15560)).toBe('Enter an amount above zero.');
  });

  it('refuses more than the balance with the E 5.2 message', () => {
    expect(validateWithdrawalAmount(20000, 15560)).toBe(
      'Amount is more than your available balance (LKR 15,560).',
    );
    expect(validateWithdrawalAmount(15560.01, 15560)).not.toBeNull();
  });

  it('accepts anything up to the whole balance', () => {
    expect(validateWithdrawalAmount(10000, 15560)).toBeNull();
    expect(validateWithdrawalAmount(15560, 15560)).toBeNull();
    expect(validateWithdrawalAmount(0.5, 15560)).toBeNull();
  });
});

describe('quickAmountsFor', () => {
  it('offers the designed amounts and the maximum (E 5.1)', () => {
    expect(quickAmountsFor(15560)).toEqual([
      { value: 5000, isMax: false },
      { value: 10000, isMax: false },
      { value: 15560, isMax: true },
    ]);
  });

  it('leaves out amounts the balance does not cover, and never repeats the maximum', () => {
    expect(quickAmountsFor(8000)).toEqual([
      { value: 5000, isMax: false },
      { value: 8000, isMax: true },
    ]);
    expect(quickAmountsFor(10000)).toEqual([
      { value: 5000, isMax: false },
      { value: 10000, isMax: true },
    ]);
    expect(quickAmountsFor(3000)).toEqual([{ value: 3000, isMax: true }]);
  });

  it('offers nothing when there is nothing to withdraw', () => {
    expect(quickAmountsFor(0)).toEqual([]);
  });
});

describe('filters and order', () => {
  it('matches every status for "all" and one status otherwise', () => {
    expect(history.filter((item) => matchesWithdrawalFilter(item, 'all'))).toHaveLength(4);
    expect(
      history.filter((item) => matchesWithdrawalFilter(item, 'paid')).map((item) => item.id),
    ).toEqual(['paid-1', 'paid-2']);
    expect(
      history.filter((item) => matchesWithdrawalFilter(item, 'rejected')).map((item) => item.id),
    ).toEqual(['rejected']);
  });

  it('sorts newest first, keeping the order of payouts on the same day, without mutating', () => {
    const input = [
      makeWithdrawal({ id: 'old', date: '2026-08-20' }),
      makeWithdrawal({ id: 'same-a', date: '2026-10-09' }),
      makeWithdrawal({ id: 'mid', date: '2026-09-28' }),
      makeWithdrawal({ id: 'same-b', date: '2026-10-09' }),
    ];
    expect(sortWithdrawals(input).map((item) => item.id)).toEqual([
      'same-a',
      'same-b',
      'mid',
      'old',
    ]);
    expect(input[0]?.id).toBe('old');
  });
});

describe('formatShortReference', () => {
  it('drops the year for the table column (E 5.5)', () => {
    expect(formatShortReference('WD-2026-0031')).toBe('WD-0031');
    expect(formatShortReference('SAL-2026-0027')).toBe('SAL-0027');
  });

  it('keeps references in any other format', () => {
    expect(formatShortReference('PAY-88213')).toBe('PAY-88213');
    expect(formatShortReference('BOC-TRX-88213')).toBe('BOC-TRX-88213');
  });
});
