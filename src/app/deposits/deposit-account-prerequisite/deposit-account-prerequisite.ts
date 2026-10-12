const APPROVED_SHARE_STATUS_CODES = new Set([
  'shareAccountStatusType.approved',
  'shareAccountStatusType.active'
]);

export interface ShareAccountStatus {
  status?: {
    code?: string;
  };
}

/**
 * A deposit account is allowed only after a share account has been approved.
 * An active share account already passed approval, so it satisfies the rule.
 * Submitted, rejected, and closed share accounts do not.
 */
export function hasApprovedShareAccount(shareAccounts: readonly ShareAccountStatus[] | null | undefined): boolean {
  if (!shareAccounts?.length) {
    return false;
  }
  return shareAccounts.some((account) => APPROVED_SHARE_STATUS_CODES.has(account?.status?.code ?? ''));
}
