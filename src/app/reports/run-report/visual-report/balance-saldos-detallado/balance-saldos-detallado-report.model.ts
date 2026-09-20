import { VisualReportRecord, VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface DetailedBalanceEntry {
  sequence: number;
  journalNumber: string;
  date: string;
  branchCode: string;
  description: string;
  debit: number;
  credit: number;
}

export interface DetailedBalanceAccount {
  displayOrder: number;
  code: string;
  parentCode: string;
  level: number;
  description: string;
  balanceNature: 'D' | 'A';
  openingBalance: number;
  debitMovement: number;
  creditMovement: number;
  endingBalance: number;
  detailOpeningBalance: number | null;
  detailDebitTotal: number | null;
  detailCreditTotal: number | null;
  entries: DetailedBalanceEntry[];
}

export interface BalanceSaldosDetalladoViewModel {
  organizationName: string;
  title: string;
  reportDate: string;
  currencyLabel: string;
  generatedOn: string;
  generatedBy: string;
  accounts: DetailedBalanceAccount[];
  debitTotal: number;
  creditTotal: number;
}

const REQUIRED_COLUMNS = [
  'display_order',
  'row_type',
  'as_of_date',
  'account_code',
  'parent_code',
  'account_level',
  'account_description',
  'balance_nature',
  'opening_balance',
  'debit_movement',
  'credit_movement',
  'ending_balance',
  'detail_opening_balance',
  'detail_debit_total',
  'detail_credit_total',
  'journal_number',
  'journal_date',
  'branch_code',
  'detail_sequence',
  'entry_description',
  'detail_debit',
  'detail_credit'
] as const;

export function buildBalanceSaldosDetalladoViewModel(
  result: VisualReportResult,
  generatedBy = ''
): BalanceSaldosDetalladoViewModel {
  const columns = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length > 0) {
    throw new Error(`Balance de Saldos Detallado is missing required columns: ${missing.join(', ')}.`);
  }

  const records = resultsetToRecords(result).sort(
    (a, b) => requiredNumber(a, 'display_order') - requiredNumber(b, 'display_order')
  );
  const accountRecords = records.filter((record) => requiredString(record, 'row_type') === 'ACCOUNT');
  const detailRecords = records.filter((record) => requiredString(record, 'row_type') === 'DETAIL');
  if (accountRecords.length === 0) {
    throw new Error('Balance de Saldos Detallado contains no account rows.');
  }
  if (accountRecords.length + detailRecords.length !== records.length) {
    throw new Error('Balance de Saldos Detallado contains an unsupported row type.');
  }

  const accounts = new Map<string, DetailedBalanceAccount>();
  for (const record of accountRecords) {
    const code = requiredString(record, 'account_code');
    if (accounts.has(code)) {
      throw new Error(`Balance de Saldos Detallado contains duplicate account ${code}.`);
    }
    const balanceNature = requiredString(record, 'balance_nature');
    if (balanceNature !== 'D' && balanceNature !== 'A') {
      throw new Error(`Account ${code} has an invalid balance nature.`);
    }
    const openingBalance = signedMoney(record.opening_balance, 'opening_balance');
    const debitMovement = amount(record.debit_movement, 'debit_movement');
    const creditMovement = amount(record.credit_movement, 'credit_movement');
    const endingBalance = signedMoney(record.ending_balance, 'ending_balance');
    const expectedEnding = cents(
      openingBalance + (balanceNature === 'D' ? debitMovement - creditMovement : creditMovement - debitMovement)
    );
    if (expectedEnding !== endingBalance) {
      throw new Error(
        `Account ${code} does not reconcile: ${openingBalance.toFixed(2)} / ${debitMovement.toFixed(2)} / ${creditMovement.toFixed(2)} / ${endingBalance.toFixed(2)}.`
      );
    }

    accounts.set(code, {
      displayOrder: requiredNumber(record, 'display_order'),
      code,
      parentCode: optionalString(record.parent_code),
      level: requiredNumber(record, 'account_level'),
      description: requiredString(record, 'account_description'),
      balanceNature,
      openingBalance,
      debitMovement,
      creditMovement,
      endingBalance,
      detailOpeningBalance: nullableSignedMoney(record.detail_opening_balance),
      detailDebitTotal: nullableAmount(record.detail_debit_total),
      detailCreditTotal: nullableAmount(record.detail_credit_total),
      entries: []
    });
  }

  for (const record of detailRecords) {
    const code = requiredString(record, 'account_code');
    const account = accounts.get(code);
    if (!account) {
      throw new Error(`Detail row references unknown account ${code}.`);
    }
    const debit = amount(record.detail_debit, 'detail_debit');
    const credit = amount(record.detail_credit, 'detail_credit');
    if ((debit === 0) === (credit === 0)) {
      throw new Error(`Account ${code} detail ${record.detail_sequence} must contain exactly one amount side.`);
    }
    account.entries.push({
      sequence: requiredNumber(record, 'detail_sequence'),
      journalNumber: requiredString(record, 'journal_number'),
      date: formatDate(record.journal_date),
      branchCode: requiredString(record, 'branch_code'),
      description: requiredString(record, 'entry_description'),
      debit,
      credit
    });
  }

  for (const account of accounts.values()) {
    account.entries.sort((a, b) => a.journalNumber.localeCompare(b.journalNumber, 'en') || a.sequence - b.sequence);
    if (account.entries.length === 0) {
      continue;
    }
    if (account.detailOpeningBalance == null || account.detailDebitTotal == null || account.detailCreditTotal == null) {
      throw new Error(`Account ${account.code} is missing its detail summary.`);
    }
    const debit = cents(account.entries.reduce((total, entry) => total + entry.debit, 0));
    const credit = cents(account.entries.reduce((total, entry) => total + entry.credit, 0));
    if (debit !== account.detailDebitTotal || credit !== account.detailCreditTotal) {
      throw new Error(
        `Account ${account.code} detail totals do not match: ${debit.toFixed(2)} / ${credit.toFixed(2)}.`
      );
    }
  }

  const orderedAccounts = [...accounts.values()].sort((a, b) => a.displayOrder - b.displayOrder);
  const rootAccounts = orderedAccounts.filter((account) => !account.parentCode || !accounts.has(account.parentCode));

  return {
    organizationName: 'CREDESAL S.C. DE R.L. DE C.V.',
    title: 'Balance de Saldos Detallado',
    reportDate: formatDate(accountRecords[0].as_of_date),
    currencyLabel: 'Cifras en Dólares de los Estados Unidos de Norte América ($)',
    generatedOn: formatDate(new Date()),
    generatedBy,
    accounts: orderedAccounts,
    debitTotal: cents(rootAccounts.reduce((total, account) => total + account.debitMovement, 0)),
    creditTotal: cents(rootAccounts.reduce((total, account) => total + account.creditMovement, 0))
  };
}

function requiredString(record: VisualReportRecord, key: string): string {
  const value = optionalString(record[key]);
  if (!value) {
    throw new Error(`Balance de Saldos Detallado field ${key} is required.`);
  }
  return value;
}

function optionalString(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function requiredNumber(record: VisualReportRecord, key: string): number {
  const value = Number(record[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`Balance de Saldos Detallado field ${key} must be numeric.`);
  }
  return value;
}

function signedMoney(value: unknown, field: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Balance de Saldos Detallado field ${field} contains an invalid amount.`);
  }
  return cents(number);
}

function amount(value: unknown, field: string): number {
  const number = signedMoney(value, field);
  if (number < 0) {
    throw new Error(`Balance de Saldos Detallado field ${field} cannot be negative.`);
  }
  return number;
}

function nullableSignedMoney(value: unknown): number | null {
  return value == null || value === '' ? null : signedMoney(value, 'detail summary');
}

function nullableAmount(value: unknown): number | null {
  return value == null || value === '' ? null : amount(value, 'detail summary');
}

function cents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatDate(value: unknown): string {
  if (Array.isArray(value) && value.length >= 3) {
    return `${String(value[2]).padStart(2, '0')}/${String(value[1]).padStart(2, '0')}/${value[0]}`;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
  return optionalString(value);
}
