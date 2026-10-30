import {
  makePayoutAccountDto,
  makeSalaryPayment,
  makeWithdrawalDto,
} from '../../__fixtures__/withdrawalFixtures';
import { paymentToWithdrawal, toPayoutAccount, toWithdrawal } from '../withdrawalMapper';

describe('toWithdrawal', () => {
  it('maps a request to the app model', () => {
    expect(toWithdrawal(makeWithdrawalDto())).toEqual({
      id: 'wd000000-0000-4000-8000-000000000031',
      reference: 'WD-2026-0031',
      amount: 10000,
      status: 'pending',
      date: '2026-10-09',
      accountLabel: 'BOC ···· 4421',
      rejectionReason: null,
    });
  });

  it('maps every status', () => {
    expect(toWithdrawal(makeWithdrawalDto({ status: 'PAID' })).status).toBe('paid');
    expect(toWithdrawal(makeWithdrawalDto({ status: 'REJECTED' })).status).toBe('rejected');
  });

  it('keeps a rejection reason and drops a blank one', () => {
    expect(
      toWithdrawal(makeWithdrawalDto({ rejectionReason: ' More than the balance. ' }))
        .rejectionReason,
    ).toBe('More than the balance.');
    expect(toWithdrawal(makeWithdrawalDto({ rejectionReason: '  ' })).rejectionReason).toBeNull();
    expect(
      toWithdrawal(makeWithdrawalDto({ rejectionReason: undefined })).rejectionReason,
    ).toBeNull();
  });

  it('dates the request on the local day it was made', () => {
    // Tests run in UTC; 23:30 UTC is still the 9th here.
    expect(toWithdrawal(makeWithdrawalDto({ requestedAt: '2026-10-09T23:30:00.000Z' })).date).toBe(
      '2026-10-09',
    );
  });
});

describe('toPayoutAccount', () => {
  it('maps the account', () => {
    expect(toPayoutAccount(makePayoutAccountDto())).toEqual({
      id: 'acc0b0c0-4421-4000-8000-000000004421',
      bankName: 'Bank of Ceylon',
      bankCode: 'BOC',
      branchName: 'Biyagama',
      accountHolderName: 'Kasun Fernando',
      last4: '4421',
      verified: true,
    });
  });

  it('treats a missing or blank branch as none', () => {
    expect(toPayoutAccount(makePayoutAccountDto({ branchName: null })).branchName).toBeNull();
    expect(toPayoutAccount(makePayoutAccountDto({ branchName: ' ' })).branchName).toBeNull();
  });
});

describe('paymentToWithdrawal', () => {
  it('shows a payout an admin recorded as a paid withdrawal', () => {
    expect(paymentToWithdrawal(makeSalaryPayment())).toEqual({
      id: 'pay-27',
      reference: 'SAL-2026-0027',
      amount: 6000,
      status: 'paid',
      date: '2026-09-28',
      accountLabel: 'Bank transfer',
      rejectionReason: null,
    });
  });

  it('names how the admin paid', () => {
    expect(paymentToWithdrawal(makeSalaryPayment({ method: 'CASH' })).accountLabel).toBe('Cash');
    expect(paymentToWithdrawal(makeSalaryPayment({ method: 'CHEQUE' })).accountLabel).toBe(
      'Cheque',
    );
    expect(paymentToWithdrawal(makeSalaryPayment({ method: 'ONLINE_CARD' })).accountLabel).toBe(
      'Card',
    );
    expect(paymentToWithdrawal(makeSalaryPayment({ method: 'OTHER' })).accountLabel).toBe('Payout');
  });
});
