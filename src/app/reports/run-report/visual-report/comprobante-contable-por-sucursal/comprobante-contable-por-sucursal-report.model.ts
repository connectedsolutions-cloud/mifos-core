import { VisualReportRecord, VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface BranchVoucherAccount {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

export interface BranchVoucherGroup {
  code: string;
  name: string;
  accounts: BranchVoucherAccount[];
}

export interface ComprobanteContablePorSucursalViewModel {
  organizationName: string;
  title: string;
  currencyLabel: string;
  generatedOn: string;
  generatedBy: string;
  officeName: string;
  reportDate: string;
  groups: BranchVoucherGroup[];
  debitTotal: number;
  creditTotal: number;
  totalInWords: string;
}

const REQUIRED_COLUMNS = [
  'row_sequence',
  'row_type',
  'office_name',
  'report_date',
  'group_code',
  'group_name',
  'account_code',
  'account_name',
  'debit',
  'credit'
] as const;

export function buildComprobanteContablePorSucursalViewModel(
  result: VisualReportResult,
  generatedBy = ''
): ComprobanteContablePorSucursalViewModel {
  const columns = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length > 0) {
    throw new Error(`Comprobante Contable por Sucursal is missing required columns: ${missing.join(', ')}.`);
  }

  const records = resultsetToRecords(result).sort(
    (left, right) => requiredNumber(left, 'row_sequence') - requiredNumber(right, 'row_sequence')
  );
  if (records.length === 0) {
    throw new Error('Comprobante Contable por Sucursal has no rows.');
  }

  const first = records[0];
  const officeName = requiredString(first, 'office_name');
  const reportDate = formatDate(first.report_date);
  const groups: BranchVoucherGroup[] = [];
  const groupByCode = new Map<string, BranchVoucherGroup>();
  let declaredDebit: number | null = null;
  let declaredCredit: number | null = null;
  let computedDebit = 0;
  let computedCredit = 0;

  for (const record of records) {
    if (requiredString(record, 'office_name') !== officeName || formatDate(record.report_date) !== reportDate) {
      throw new Error('Comprobante Contable por Sucursal contains mixed office or date scopes.');
    }

    const rowType = requiredString(record, 'row_type').toUpperCase();
    if (rowType === 'GROUP') {
      const code = requiredString(record, 'group_code');
      if (groupByCode.has(code)) {
        throw new Error(`Comprobante Contable por Sucursal repeats group ${code}.`);
      }
      const group: BranchVoucherGroup = { code, name: requiredString(record, 'group_name'), accounts: [] };
      groupByCode.set(code, group);
      groups.push(group);
      continue;
    }

    if (rowType === 'ACCOUNT') {
      const groupCode = requiredString(record, 'group_code');
      const group = groupByCode.get(groupCode);
      if (!group) {
        throw new Error(`Comprobante Contable por Sucursal account precedes group ${groupCode}.`);
      }
      const debit = money(record.debit);
      const credit = money(record.credit);
      group.accounts.push({
        code: requiredString(record, 'account_code'),
        name: requiredString(record, 'account_name'),
        debit,
        credit
      });
      computedDebit = cents(computedDebit + debit);
      computedCredit = cents(computedCredit + credit);
      continue;
    }

    if (rowType === 'TOTAL') {
      if (declaredDebit !== null || declaredCredit !== null) {
        throw new Error('Comprobante Contable por Sucursal contains more than one total row.');
      }
      declaredDebit = money(record.debit);
      declaredCredit = money(record.credit);
      continue;
    }

    throw new Error(`Comprobante Contable por Sucursal has unsupported row type ${rowType}.`);
  }

  if (declaredDebit === null || declaredCredit === null) {
    throw new Error('Comprobante Contable por Sucursal is missing its total row.');
  }
  if (computedDebit !== declaredDebit || computedCredit !== declaredCredit) {
    throw new Error(
      `Comprobante Contable por Sucursal totals do not match its account rows: ${computedDebit.toFixed(2)} / ${computedCredit.toFixed(2)}.`
    );
  }
  if (declaredDebit !== declaredCredit) {
    throw new Error(
      `Comprobante Contable por Sucursal is unbalanced: ${declaredDebit.toFixed(2)} / ${declaredCredit.toFixed(2)}.`
    );
  }
  if (groups.some((group) => group.accounts.length === 0)) {
    throw new Error('Comprobante Contable por Sucursal contains an empty account group.');
  }

  return {
    organizationName: 'CREDESAL S.C. DE R.L. DE C.V.',
    title: 'Comprobante Contable por Sucursal',
    currencyLabel: 'Cifras en Dólares de los Estados Unidos de Norte América ($)',
    generatedOn: formatDate(new Date()),
    generatedBy,
    officeName,
    reportDate,
    groups,
    debitTotal: declaredDebit,
    creditTotal: declaredCredit,
    totalInWords: amountInWords(declaredDebit)
  };
}

function requiredString(record: VisualReportRecord, key: string): string {
  const value = record[key] == null ? '' : String(record[key]).trim();
  if (!value) {
    throw new Error(`Comprobante Contable por Sucursal field ${key} is required.`);
  }
  return value;
}

function requiredNumber(record: VisualReportRecord, key: string): number {
  const value = Number(record[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`Comprobante Contable por Sucursal field ${key} must be numeric.`);
  }
  return value;
}

function money(value: unknown): number {
  const number = value == null || value === '' ? 0 : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error('Comprobante Contable por Sucursal contains an invalid amount.');
  }
  return cents(number);
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
  return value == null ? '' : String(value).trim();
}

function amountInWords(amount: number): string {
  const whole = Math.floor(amount);
  const fraction = Math.round((amount - whole) * 100);
  return `${integerInWords(whole)} ${String(fraction).padStart(2, '0')}/100 DÓLARES`;
}

function integerInWords(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value >= 1_000_000_000) {
    throw new Error('Comprobante Contable por Sucursal total is outside the supported amount-in-words range.');
  }
  if (value === 0) {
    return 'CERO';
  }
  if (value >= 1_000_000) {
    const millions = Math.floor(value / 1_000_000);
    const remainder = value % 1_000_000;
    const label = millions === 1 ? 'UN MILLÓN' : `${integerInWords(millions)} MILLONES`;
    return remainder ? `${label} ${integerInWords(remainder)}` : label;
  }
  if (value >= 1000) {
    const thousands = Math.floor(value / 1000);
    const remainder = value % 1000;
    const label = thousands === 1 ? 'MIL' : `${integerInWords(thousands)} MIL`;
    return remainder ? `${label} ${integerInWords(remainder)}` : label;
  }
  return underThousand(value);
}

function underThousand(value: number): string {
  const exact: Record<number, string> = {
    1: 'UNO',
    2: 'DOS',
    3: 'TRES',
    4: 'CUATRO',
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE',
    10: 'DIEZ',
    11: 'ONCE',
    12: 'DOCE',
    13: 'TRECE',
    14: 'CATORCE',
    15: 'QUINCE',
    16: 'DIECISEIS',
    17: 'DIECISIETE',
    18: 'DIECIOCHO',
    19: 'DIECINUEVE',
    20: 'VEINTE',
    21: 'VEINTIUNO',
    22: 'VEINTIDOS',
    23: 'VEINTITRES',
    24: 'VEINTICUATRO',
    25: 'VEINTICINCO',
    26: 'VEINTISEIS',
    27: 'VEINTISIETE',
    28: 'VEINTIOCHO',
    29: 'VEINTINUEVE',
    100: 'CIEN'
  };
  if (exact[value]) {
    return exact[value];
  }
  if (value < 100) {
    const tens: Record<number, string> = {
      30: 'TREINTA',
      40: 'CUARENTA',
      50: 'CINCUENTA',
      60: 'SESENTA',
      70: 'SETENTA',
      80: 'OCHENTA',
      90: 'NOVENTA'
    };
    const base = Math.floor(value / 10) * 10;
    return `${tens[base]} Y ${exact[value % 10]}`;
  }
  const hundreds: Record<number, string> = {
    1: 'CIENTO',
    2: 'DOSCIENTOS',
    3: 'TRESCIENTOS',
    4: 'CUATROCIENTOS',
    5: 'QUINIENTOS',
    6: 'SEISCIENTOS',
    7: 'SETECIENTOS',
    8: 'OCHOCIENTOS',
    9: 'NOVECIENTOS'
  };
  const remainder = value % 100;
  return remainder
    ? `${hundreds[Math.floor(value / 100)]} ${underThousand(remainder)}`
    : hundreds[Math.floor(value / 100)];
}
