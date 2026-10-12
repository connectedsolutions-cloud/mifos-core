import { ACCOUNT_STATUS_PROGRESS_LABELS, buildAccountStatusProgress } from './account-status-progress';

describe('buildAccountStatusProgress', () => {
  it('marks approval as the next step when a loan is submitted', () => {
    const progress = buildAccountStatusProgress('loan', 'loanStatusType.submitted.and.pending.approval');

    expect(progress.onPath).toBe(true);
    expect(progress.steps.map((step) => step.state)).toEqual([
      'current',
      'next',
      'unavailable'
    ]);
    expect(progress.steps[2].labelKey).toBe(ACCOUNT_STATUS_PROGRESS_LABELS.disburse);
  });

  it('marks disbursement as the next step when a loan is approved', () => {
    const progress = buildAccountStatusProgress('loan', 'loanStatusType.approved');

    expect(progress.steps.map((step) => step.state)).toEqual([
      'completed',
      'current',
      'next'
    ]);
  });

  it('shows change dates only for steps the account has already reached', () => {
    const progress = buildAccountStatusProgress('loan', 'loanStatusType.approved', {
      submitted: [
        2026,
        1,
        4
      ],
      approved: [
        2026,
        2,
        10
      ],
      active: [
        2026,
        3,
        1
      ]
    });

    expect(progress.steps.map((step) => step.changedOn)).toEqual([
      [
        2026,
        1,
        4
      ],
      [
        2026,
        2,
        10
      ],
      null
    ]);
  });

  it('marks an active loan as current with no following step', () => {
    const progress = buildAccountStatusProgress('loan', 'loanStatusType.active');

    expect(progress.steps.map((step) => step.state)).toEqual([
      'completed',
      'completed',
      'current'
    ]);
  });

  it('grays every step when a loan has left the path', () => {
    const progress = buildAccountStatusProgress('loan', 'loanStatusType.rejected');

    expect(progress.onPath).toBe(false);
    expect(progress.steps.every((step) => step.state === 'unavailable')).toBe(true);
  });

  it('marks activation as the next step when a savings account is submitted', () => {
    const progress = buildAccountStatusProgress('savings', 'savingsAccountStatusType.submitted.and.pending.approval');

    expect(progress.onPath).toBe(true);
    expect(progress.steps.map((step) => step.state)).toEqual([
      'current',
      'next',
      'unavailable'
    ]);
    expect(progress.steps[2].labelKey).toBe(ACCOUNT_STATUS_PROGRESS_LABELS.activate);
  });

  it('marks activation as the next step when a savings account is approved', () => {
    const progress = buildAccountStatusProgress('savings', 'savingsAccountStatusType.approved');

    expect(progress.steps.map((step) => step.state)).toEqual([
      'completed',
      'current',
      'next'
    ]);
    expect(progress.steps[2].labelKey).toBe(ACCOUNT_STATUS_PROGRESS_LABELS.activate);
  });

  it('marks an active savings account as current with no following step', () => {
    const progress = buildAccountStatusProgress('savings', 'savingsAccountStatusType.active');

    expect(progress.steps.map((step) => step.state)).toEqual([
      'completed',
      'completed',
      'current'
    ]);
  });

  it('grays every step when a savings account has left the path', () => {
    const progress = buildAccountStatusProgress('savings', 'savingsAccountStatusType.closed');

    expect(progress.onPath).toBe(false);
    expect(progress.steps.every((step) => step.state === 'unavailable')).toBe(true);
  });

  it('marks activation as the next step when a client is pending', () => {
    const progress = buildAccountStatusProgress('client', 'clientStatusType.pending', {
      pending: [
        2026,
        1,
        4
      ],
      active: [
        2026,
        1,
        28
      ]
    });

    expect(progress.onPath).toBe(true);
    expect(progress.steps.map((step) => step.id)).toEqual([
      'pending',
      'active'
    ]);
    expect(progress.steps.map((step) => step.state)).toEqual([
      'current',
      'next'
    ]);
    expect(progress.steps.map((step) => step.labelKey)).toEqual([
      ACCOUNT_STATUS_PROGRESS_LABELS.pending,
      ACCOUNT_STATUS_PROGRESS_LABELS.active
    ]);
    expect(progress.steps.map((step) => step.changedOn)).toEqual([
      [
        2026,
        1,
        4
      ],
      null
    ]);
  });

  it('marks an active client as current with the pending step completed', () => {
    const progress = buildAccountStatusProgress('client', 'clientStatusType.active', {
      pending: [
        2026,
        1,
        4
      ],
      active: [
        2026,
        1,
        28
      ]
    });

    expect(progress.steps.map((step) => step.state)).toEqual([
      'completed',
      'current'
    ]);
    expect(progress.steps.map((step) => step.changedOn)).toEqual([
      [
        2026,
        1,
        4
      ],
      [
        2026,
        1,
        28
      ]

    ]);
  });

  it('keeps a transferring client on the active step', () => {
    const inProgress = buildAccountStatusProgress('client', 'clientStatusType.transfer.in.progress');
    const onHold = buildAccountStatusProgress('client', 'clientStatusType.transfer.on.hold');

    expect(inProgress.onPath).toBe(true);
    expect(onHold.onPath).toBe(true);
    expect(inProgress.steps.map((step) => step.state)).toEqual([
      'completed',
      'current'
    ]);
    expect(onHold.steps.map((step) => step.state)).toEqual([
      'completed',
      'current'
    ]);
  });

  it('grays every step when a client has left the path', () => {
    for (const statusCode of [
      'clientStatusType.closed',
      'clientStatusType.rejected',
      'clientStatusType.withdraw'
    ]) {
      const progress = buildAccountStatusProgress('client', statusCode);

      expect(progress.onPath).toBe(false);
      expect(progress.steps.every((step) => step.state === 'unavailable')).toBe(true);
    }
  });

  it('uses activation for fixed, recurring, and share accounts', () => {
    expect(buildAccountStatusProgress('fixedDeposit', 'savingsAccountStatusType.active').steps[2].labelKey).toBe(
      ACCOUNT_STATUS_PROGRESS_LABELS.activate
    );
    expect(buildAccountStatusProgress('recurringDeposit', 'savingsAccountStatusType.approved').steps[2].labelKey).toBe(
      ACCOUNT_STATUS_PROGRESS_LABELS.activate
    );
    expect(buildAccountStatusProgress('share', 'shareAccountStatusType.approved').steps[2].labelKey).toBe(
      ACCOUNT_STATUS_PROGRESS_LABELS.activate
    );
  });
});
