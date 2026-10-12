import { VisualReportRecord, VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface AuxiliaryLedgerEntry {
  order: number;
  journalNumber: string;
  checkNumber: string;
  officeName: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface AuxiliaryLedgerAccount {
  displayOrder: number;
  code: string;
  name: string;
  balanceNature: 'D' | 'A';
  openingBalance: number;
  debitTotal: number;
  creditTotal: number;
  endingBalance: number;
  entries: AuxiliaryLedgerEntry[];
}

export interface InformeAuxiliarMayorViewModel {
  organizationName: string;
  title: string;
  periodLabel: string;
  currencyLabel: string;
  generatedOn: string;
  generatedBy: string;
  accounts: AuxiliaryLedgerAccount[];
}

const REQUIRED_COLUMNS = [
  'display_order',
  'row_type',
  'start_date',
  'end_date',
  'account_code',
  'account_name',
  'balance_nature',
  'journal_number',
  'check_number',
  'office_name',
  'journal_date',
  'entry_description',
  'opening_balance',
  'debit',
  'credit',
  'running_balance',
  'account_debit_total',
  'account_credit_total',
  'ending_balance',
  'movement_order'
] as const;

export function buildInformeAuxiliarMayorViewModel(
  result: VisualReportResult,
  generatedBy = ''
): InformeAuxiliarMayorViewModel {
  const columns = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length > 0) {
    throw new Error(`Informe Auxiliar de Mayor is missing required columns: ${missing.join(', ')}.`);
  }

  const records = resultsetToRecords(result).sort(
    (a, b) => requiredNumber(a, 'display_order') - requiredNumber(b, 'display_order')
  );
  const unsupported = records.find(
    (record) => ![
        'ACCOUNT',
        'DETAIL',
        'TOTAL'
      ].includes(requiredString(record, 'row_type'))
  );
  if (unsupported) {
    throw new Error('Informe Auxiliar de Mayor contains an unsupported row type.');
  }

  const accountRecords = records.filter((record) => requiredString(record, 'row_type') === 'ACCOUNT');
  if (accountRecords.length === 0) {
    throw new Error('Informe Auxiliar de Mayor contains no account rows.');
  }

  const accounts = new Map<string, AuxiliaryLedgerAccount>();
  for (const record of accountRecords) {
    const code = requiredString(record, 'account_code');
    if (accounts.has(code)) {
      throw new Error(`Informe Auxiliar de Mayor contains duplicate account ${code}.`);
    }
    const balanceNature = requiredString(record, 'balance_nature');
    if (balanceNature !== 'D' && balanceNature !== 'A') {
      throw new Error(`Account ${code} has an invalid balance nature.`);
    }
    accounts.set(code, {
      displayOrder: requiredNumber(record, 'display_order'),
      code,
      name: requiredString(record, 'account_name'),
      balanceNature,
      openingBalance: money(record.opening_balance, 'opening_balance'),
      debitTotal: amount(record.account_debit_total, 'account_debit_total'),
      creditTotal: amount(record.account_credit_total, 'account_credit_total'),
      endingBalance: money(record.ending_balance, 'ending_balance'),
      entries: []
    });
  }

  for (const record of records.filter((item) => requiredString(item, 'row_type') === 'DETAIL')) {
    const code = requiredString(record, 'account_code');
    const account = accounts.get(code);
    if (!account) {
      throw new Error(`Detail row references unknown account ${code}.`);
    }
    const debit = amount(record.debit, 'debit');
    const credit = amount(record.credit, 'credit');
    if ((debit === 0) === (credit === 0)) {
      throw new Error(`Account ${code} movement ${record.movement_order} must contain exactly one amount side.`);
    }
    account.entries.push({
      order: requiredNumber(record, 'movement_order'),
      journalNumber: requiredString(record, 'journal_number'),
      checkNumber: optionalString(record.check_number),
      officeName: requiredString(record, 'office_name'),
      date: formatDate(record.journal_date),
      description: requiredString(record, 'entry_description'),
      debit,
      credit,
      runningBalance: money(record.running_balance, 'running_balance')
    });
  }

  const totalRecords = records.filter((record) => requiredString(record, 'row_type') === 'TOTAL');
  if (totalRecords.length !== accounts.size) {
    throw new Error('Informe Auxiliar de Mayor must contain one total row per account.');
  }
  for (const record of totalRecords) {
    const code = requiredString(record, 'account_code');
    const account = accounts.get(code);
    if (!account) {
      throw new Error(`Total row references unknown account ${code}.`);
    }
    if (
      amount(record.debit, 'debit') !== account.debitTotal ||
      amount(record.credit, 'credit') !== account.creditTotal ||
      money(record.running_balance, 'running_balance') !== account.endingBalance
    ) {
      throw new Error(`Account ${code} total row does not match its account controls.`);
    }
  }

  for (const account of accounts.values()) {
    account.entries.sort((a, b) => a.order - b.order);
    let running = account.openingBalance;
    let debitTotal = 0;
    let creditTotal = 0;
    for (const entry of account.entries) {
      debitTotal = cents(debitTotal + entry.debit);
      creditTotal = cents(creditTotal + entry.credit);
      running = cents(
        running + (account.balanceNature === 'D' ? entry.debit - entry.credit : entry.credit - entry.debit)
      );
      if (running !== entry.runningBalance) {
        throw new Error(`Account ${account.code} movement ${entry.order} has an invalid running balance.`);
      }
    }
    if (debitTotal !== account.debitTotal || creditTotal !== account.creditTotal || running !== account.endingBalance) {
      throw new Error(`Account ${account.code} does not reconcile to its period controls.`);
    }
  }

  return {
    organizationName: 'CREDESAL S.C. DE R.L. DE C.V.',
    title: 'Informe Auxiliar de Mayor',
    periodLabel: `Del ${formatDate(accountRecords[0].start_date)} al ${formatDate(accountRecords[0].end_date)}`,
    currencyLabel: 'Cifras en Dólares de los Estados Unidos de Norte América ($)',
    generatedOn: formatDate(new Date()),
    generatedBy,
    accounts: [...accounts.values()].sort((a, b) => a.displayOrder - b.displayOrder)
  };
}

function requiredString(record: VisualReportRecord, key: string): string {
  const value = optionalString(record[key]);
  if (!value) {
    throw new Error(`Informe Auxiliar de Mayor field ${key} is required.`);
  }
  return value;
}

function optionalString(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function requiredNumber(record: VisualReportRecord, key: string): number {
  const value = Number(record[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`Informe Auxiliar de Mayor field ${key} must be numeric.`);
  }
  return value;
}

function money(value: unknown, field: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Informe Auxiliar de Mayor field ${field} contains an invalid amount.`);
  }
  return cents(number);
}

function amount(value: unknown, field: string): number {
  const number = money(value, field);
  if (number < 0) {
    throw new Error(`Informe Auxiliar de Mayor field ${field} cannot be negative.`);
  }
  return number;
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
