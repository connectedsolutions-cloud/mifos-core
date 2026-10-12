export type AccountKind = 'loan' | 'savings' | 'fixedDeposit' | 'recurringDeposit' | 'share' | 'client';

export type AccountStatusStepState = 'completed' | 'current' | 'next' | 'unavailable';

export type AccountStatusChangedOn = string | number[] | Date;

export interface AccountStatusStepDates {
  submitted?: AccountStatusChangedOn | null;
  approved?: AccountStatusChangedOn | null;
  pending?: AccountStatusChangedOn | null;
  active?: AccountStatusChangedOn | null;
}

export interface AccountStatusStep {
  id: 'submitted' | 'approved' | 'pending' | 'active';
  labelKey: string;
  state: AccountStatusStepState;
  changedOn: AccountStatusChangedOn | null;
}

export interface AccountStatusProgress {
  onPath: boolean;
  steps: AccountStatusStep[];
}

export const ACCOUNT_STATUS_PROGRESS_LABELS = {
  submitted: 'labels.accountStatusProgress.Submitted',
  approved: 'labels.accountStatusProgress.Approved',
  disburse: 'labels.accountStatusProgress.Disburse',
  activate: 'labels.accountStatusProgress.Activate',
  pending: 'labels.accountStatusProgress.Pending',
  active: 'labels.accountStatusProgress.Active',
  subtitle: 'labels.accountStatusProgress.Subtitle',
  clientSubtitle: 'labels.accountStatusProgress.Client subtitle',
  offPath: 'labels.accountStatusProgress.Off path',
  clientOffPath: 'labels.accountStatusProgress.Client off path',
  completed: 'labels.accountStatusProgress.Completed',
  current: 'labels.accountStatusProgress.Current',
  next: 'labels.accountStatusProgress.Next',
  unavailable: 'labels.accountStatusProgress.Unavailable'
};

const ACCOUNT_STEP_IDS: AccountStatusStep['id'][] = [
  'submitted',
  'approved',
  'active'
];

const CLIENT_STEP_IDS: AccountStatusStep['id'][] = [
  'pending',
  'active'
];

export function accountStatusProgressSubtitle(accountKind: AccountKind): string {
  return accountKind === 'client'
    ? ACCOUNT_STATUS_PROGRESS_LABELS.clientSubtitle
    : ACCOUNT_STATUS_PROGRESS_LABELS.subtitle;
}

export function accountStatusProgressOffPathLabel(accountKind: AccountKind): string {
  return accountKind === 'client'
    ? ACCOUNT_STATUS_PROGRESS_LABELS.clientOffPath
    : ACCOUNT_STATUS_PROGRESS_LABELS.offPath;
}

export function buildAccountStatusProgress(
  accountKind: AccountKind,
  statusCode: string,
  dates?: AccountStatusStepDates | null
): AccountStatusProgress {
  if (accountKind === 'client') {
    return buildSteps(CLIENT_STEP_IDS, clientLabelKeys(), clientStepIndex(statusCode), dates);
  }

  const activeLabel =
    accountKind === 'loan' ? ACCOUNT_STATUS_PROGRESS_LABELS.disburse : ACCOUNT_STATUS_PROGRESS_LABELS.activate;
  return buildSteps(
    ACCOUNT_STEP_IDS,
    [
      ACCOUNT_STATUS_PROGRESS_LABELS.submitted,
      ACCOUNT_STATUS_PROGRESS_LABELS.approved,
      activeLabel
    ],
    forwardStepIndex(statusCode),
    dates
  );
}

function clientLabelKeys(): string[] {
  return [
    ACCOUNT_STATUS_PROGRESS_LABELS.pending,
    ACCOUNT_STATUS_PROGRESS_LABELS.active
  ];
}

function buildSteps(
  stepIds: AccountStatusStep['id'][],
  labelKeys: string[],
  currentIndex: number | null,
  dates?: AccountStatusStepDates | null
): AccountStatusProgress {
  return {
    onPath: currentIndex !== null,
    steps: stepIds.map((id, index) => {
      const state = stepState(index, currentIndex);
      return {
        id,
        labelKey: labelKeys[index],
        state,
        changedOn: state === 'completed' || state === 'current' ? (dates?.[id] ?? null) : null
      };
    })
  };
}

export function accountStatusStepStateLabel(state: AccountStatusStepState): string {
  switch (state) {
    case 'completed':
      return ACCOUNT_STATUS_PROGRESS_LABELS.completed;
    case 'current':
      return ACCOUNT_STATUS_PROGRESS_LABELS.current;
    case 'next':
      return ACCOUNT_STATUS_PROGRESS_LABELS.next;
    case 'unavailable':
      return ACCOUNT_STATUS_PROGRESS_LABELS.unavailable;
  }
}

function clientStepIndex(statusCode: string): number | null {
  switch (statusCode) {
    case 'clientStatusType.pending':
      return 0;
    case 'clientStatusType.active':
    case 'clientStatusType.transfer.in.progress':
    case 'clientStatusType.transfer.on.hold':
      return 1;
    default:
      return null;
  }
}

function forwardStepIndex(statusCode: string): number | null {
  if (!statusCode) {
    return null;
  }
  if (statusCode.endsWith('submitted.and.pending.approval')) {
    return 0;
  }
  if (statusCode.endsWith('.approved')) {
    return 1;
  }
  if (statusCode.endsWith('.active')) {
    return 2;
  }
  return null;
}

function stepState(stepIndex: number, currentIndex: number | null): AccountStatusStepState {
  if (currentIndex === null || stepIndex > currentIndex + 1) {
    return 'unavailable';
  }
  if (stepIndex < currentIndex) {
    return 'completed';
  }
  if (stepIndex === currentIndex) {
    return 'current';
  }
  return 'next';
}
