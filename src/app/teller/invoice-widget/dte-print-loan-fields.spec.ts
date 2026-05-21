import {
  enrichDtePrintInvoiceWithLoanFields,
  normalizeLoanCreditInfo,
  resolveLineaCrediticia,
  resolveLoanIdForFetch,
  resolveNumeroCredito
} from './dte-print-loan-fields';

describe('dte-print-loan-fields', () => {
  const loanAccount = { loanProductName: 'Microcredit', externalId: 'CRED-001' };

  it('resolves credit line and loan number for loan transactions', () => {
    expect(resolveLineaCrediticia(true, loanAccount)).toBe('Microcredit');
    expect(resolveNumeroCredito(true, loanAccount)).toBe('CRED-001');
  });

  it('prefers invoice API loan fields over loan account resource', () => {
    const merged = normalizeLoanCreditInfo({ loanProductName: 'From Invoice', loanExternalId: 'INV-99' }, loanAccount);
    expect(merged.loanProductName).toBe('From Invoice');
    expect(merged.externalId).toBe('INV-99');
  });

  it('returns em dash for non-loan transactions', () => {
    expect(resolveLineaCrediticia(false, loanAccount)).toBe('—');
    expect(resolveNumeroCredito(false, loanAccount)).toBe('—');
  });

  it('enriches invoice payload for print', () => {
    const enriched = enrichDtePrintInvoiceWithLoanFields({ id: 1 }, true, loanAccount);
    expect(enriched.lineaCrediticia).toBe('Microcredit');
    expect(enriched.numeroCredito).toBe('CRED-001');
  });

  it('enriches from invoice API fields when loan account is not loaded', () => {
    const enriched = enrichDtePrintInvoiceWithLoanFields(
      { loanProductName: 'Line A', loanExternalId: 'EXT-1' },
      true,
      null
    );
    expect(enriched.lineaCrediticia).toBe('Line A');
    expect(enriched.numeroCredito).toBe('EXT-1');
  });

  it('resolves loan id from invoice when query param is missing', () => {
    expect(resolveLoanIdForFetch({ loanId: 55 }, null)).toBe(55);
    expect(resolveLoanIdForFetch({ loanId: 55 }, 42)).toBe(42);
  });
});
