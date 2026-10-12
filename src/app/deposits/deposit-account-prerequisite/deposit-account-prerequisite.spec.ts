import { hasApprovedShareAccount } from './deposit-account-prerequisite';

describe('hasApprovedShareAccount', () => {
  it('allows a deposit when a share account is approved', () => {
    expect(hasApprovedShareAccount([{ status: { code: 'shareAccountStatusType.approved' } }])).toBe(true);
  });

  it('allows a deposit when a share account is already active', () => {
    expect(hasApprovedShareAccount([{ status: { code: 'shareAccountStatusType.active' } }])).toBe(true);
  });

  it('blocks a deposit when the only share account is still pending', () => {
    expect(
      hasApprovedShareAccount([{ status: { code: 'shareAccountStatusType.submitted.and.pending.approval' } }])
    ).toBe(false);
  });

  it('blocks a deposit when share accounts are rejected, closed, or missing', () => {
    expect(hasApprovedShareAccount([{ status: { code: 'shareAccountStatusType.rejected' } }])).toBe(false);
    expect(hasApprovedShareAccount([{ status: { code: 'shareAccountStatusType.closed' } }])).toBe(false);
    expect(hasApprovedShareAccount([])).toBe(false);
    expect(hasApprovedShareAccount(null)).toBe(false);
  });
});
