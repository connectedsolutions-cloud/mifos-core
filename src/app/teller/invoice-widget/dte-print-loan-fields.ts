export interface LoanAccountCreditInfo {
  loanProductName?: string;
  externalId?: string | number | null;
}

/** Invoice GET may include loanProductName / loanExternalId / loanId from the API. */
export type LoanCreditInvoiceSource = {
  loanProductName?: string;
  loanExternalId?: string;
  loanId?: number;
  lineaCrediticia?: string;
  numeroCredito?: string;
};

function coerceExternalId(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' ? trimmed : null;
  }
  if (typeof value === 'object' && value !== null && 'value' in value) {
    const nested = (value as { value?: unknown }).value;
    return coerceExternalId(nested);
  }
  const asString = String(value).trim();
  return asString !== '' && asString !== '[object Object]' ? asString : null;
}

/** Prefer invoice API fields, then loan account resource (same order as invoice popup). */
export function normalizeLoanCreditInfo(
  invoice: LoanCreditInvoiceSource | null | undefined,
  loanAccount: LoanAccountCreditInfo | null | undefined
): LoanAccountCreditInfo {
  const productFromLoan =
    loanAccount?.loanProductName ?? (loanAccount as { loanProduct?: { name?: string } })?.loanProduct?.name;
  const productFromInvoice = invoice?.loanProductName ?? invoice?.lineaCrediticia;
  const externalFromInvoice = invoice?.loanExternalId ?? invoice?.numeroCredito;
  const externalFromLoan = coerceExternalId(loanAccount?.externalId);

  return {
    loanProductName: productFromInvoice ?? productFromLoan ?? undefined,
    externalId: externalFromInvoice ?? externalFromLoan ?? undefined
  };
}

export function resolveLineaCrediticia(
  isLoanTransaction: boolean,
  creditInfo: LoanAccountCreditInfo | null | undefined
): string {
  if (!isLoanTransaction) {
    return '—';
  }
  const name = creditInfo?.loanProductName;
  return name != null && String(name).trim() !== '' ? String(name).trim() : '—';
}

export function resolveNumeroCredito(
  isLoanTransaction: boolean,
  creditInfo: LoanAccountCreditInfo | null | undefined
): string {
  if (!isLoanTransaction) {
    return '—';
  }
  const ext = coerceExternalId(creditInfo?.externalId);
  return ext ?? '—';
}

export function enrichDtePrintInvoiceWithLoanFields<T extends Record<string, unknown>>(
  invoice: T,
  isLoanTransaction: boolean,
  loanAccount: LoanAccountCreditInfo | null | undefined
): T & { lineaCrediticia: string; numeroCredito: string } {
  const creditInfo = normalizeLoanCreditInfo(invoice as LoanCreditInvoiceSource, loanAccount);
  return {
    ...invoice,
    lineaCrediticia: resolveLineaCrediticia(isLoanTransaction, creditInfo),
    numeroCredito: resolveNumeroCredito(isLoanTransaction, creditInfo)
  };
}

export function resolveLoanIdForFetch(
  invoice: LoanCreditInvoiceSource | null | undefined,
  queryLoanId: number | null
): number | null {
  if (queryLoanId != null) {
    return queryLoanId;
  }
  const fromInvoice = invoice?.loanId;
  return fromInvoice != null && Number.isFinite(Number(fromInvoice)) ? Number(fromInvoice) : null;
}
