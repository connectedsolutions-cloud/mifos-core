import { VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface BalanceSaldosAccount {
  code: string;
  parentCode: string;
  level: number;
  description: string;
  balance: number;
}

export interface BalanceSaldosViewModel {
  organizationName: string;
  title: string;
  reportDate: string;
  generatedBy: string;
  generatedOn: string;
  accounts: BalanceSaldosAccount[];
}

const REQUIRED_COLUMNS = [
  'display_order',
  'as_of_date',
  'account_code',
  'parent_code',
  'account_level',
  'account_description',
  'ending_balance'
] as const;

export function buildBalanceSaldosViewModel(result: VisualReportResult, generatedBy = ''): BalanceSaldosViewModel {
  const columns = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length) {
    throw new Error(`Balance de Saldos is missing required columns: ${missing.join(', ')}.`);
  }

  const records = resultsetToRecords(result);
  if (!records.length) {
    throw new Error('Balance de Saldos contains no accounts.');
  }
  records.sort((a, b) => integer(a.display_order, 'display_order') - integer(b.display_order, 'display_order'));
  const accounts: BalanceSaldosAccount[] = [];
  const byCode = new Map<string, BalanceSaldosAccount>();
  let reportDate = '';
  for (const record of records) {
    const code = requiredString(record.account_code, 'account_code');
    if (byCode.has(code)) {
      throw new Error(`Balance de Saldos contains duplicate account ${code}.`);
    }
    const date = formatDate(record.as_of_date);
    if (reportDate && date !== reportDate) {
      throw new Error('Balance de Saldos contains multiple cutoff dates.');
    }
    reportDate = date;
    const account: BalanceSaldosAccount = {
      code,
      parentCode: optionalString(record.parent_code),
      level: integer(record.account_level, 'account_level'),
      description: requiredString(record.account_description, 'account_description'),
      balance: cents(record.ending_balance, 'ending_balance') / 100
    };
    if (account.level < 0) {
      throw new Error(`Account ${code} has an invalid hierarchy level.`);
    }
    accounts.push(account);
    byCode.set(code, account);
  }

  const childTotals = new Map<string, number>();
  for (const account of accounts) {
    if (!account.parentCode) {
      if (account.level !== 0) throw new Error(`Root account ${account.code} has an invalid level.`);
      continue;
    }
    const parent = byCode.get(account.parentCode);
    if (!parent || parent.level + 1 !== account.level) {
      throw new Error(`Account ${account.code} has an invalid parent.`);
    }
    childTotals.set(parent.code, (childTotals.get(parent.code) ?? 0) + Math.round(account.balance * 100));
  }
  for (const [
    code,
    childTotal
  ] of childTotals) {
    if (childTotal !== Math.round(byCode.get(code)!.balance * 100)) {
      throw new Error(`Account ${code} does not reconcile with its direct children.`);
    }
  }

  return {
    organizationName: 'CREDESAL S.C. DE R.L. DE C.V.',
    title: 'BALANCE DE SALDOS',
    reportDate,
    generatedBy,
    generatedOn: formatDate(new Date().toISOString().slice(0, 10)),
    accounts
  };
}

export function balanceSaldosCsv(document: BalanceSaldosViewModel): string {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = document.accounts.map((account) => [
      quote(account.code),
      quote(account.description),
      account.balance.toFixed(2)].join(','));
  return `\uFEFFCuenta,Descripción,Saldo Final\r\n${rows.join('\r\n')}\r\n`;
}

function requiredString(value: unknown, field: string): string {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`Balance de Saldos field ${field} is required.`);
  return text;
}

function optionalString(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function integer(value: unknown, field: string): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`Balance de Saldos field ${field} must be an integer.`);
  return number;
}

function cents(value: unknown, field: string): number {
  const text = String(value ?? '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) throw new Error(`Balance de Saldos field ${field} must be money.`);
  const amount = Number(text);
  if (!Number.isFinite(amount)) throw new Error(`Balance de Saldos field ${field} must be money.`);
  return Math.round(amount * 100);
}

function formatDate(value: unknown): string {
  if (Array.isArray(value) && value.length >= 3) {
    const [
      year,
      month,
      day
    ] = value;
    if ([
        year,
        month,
        day
      ].every((part) => Number.isInteger(part))) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }
  const text = String(value ?? '');
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) throw new Error('Balance de Saldos has an invalid cutoff date.');
  return `${match[3]}/${match[2]}/${match[1]}`;
}
