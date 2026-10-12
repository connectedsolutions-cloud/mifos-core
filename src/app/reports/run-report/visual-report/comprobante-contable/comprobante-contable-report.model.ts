import { VisualReportRecord, VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface ComprobanteLine {
  sequence: number;
  glCode: string;
  glName: string;
  sourceBranchCode: string;
  description: string;
  debit: number;
  credit: number;
}

export interface ComprobanteGroup {
  code: string;
  name: string;
  lines: ComprobanteLine[];
}

export interface ComprobanteVoucher {
  sequence: number;
  number: string;
  entryDate: string;
  officeName: string;
  auxiliaryName: string;
  statusName: string;
  concept: string;
  groups: ComprobanteGroup[];
  debitTotal: number;
  creditTotal: number;
}

export interface ComprobanteBatch {
  key: string;
  sequence: number;
  officeName: string;
  entryDate: string;
  vouchers: ComprobanteVoucher[];
}

export interface ComprobanteContableViewModel {
  organizationName: string;
  title: string;
  currencyLabel: string;
  generatedOn: string;
  generatedBy: string;
  batches: ComprobanteBatch[];
}

const REQUIRED_COLUMNS = [
  'batch_key',
  'batch_sequence',
  'voucher_sequence',
  'voucher_number',
  'entry_date',
  'office_name',
  'auxiliary_name',
  'status_name',
  'group_code',
  'group_name',
  'line_sequence',
  'gl_code',
  'gl_name',
  'source_branch_code',
  'line_description',
  'debit',
  'credit',
  'voucher_concept'
] as const;

export function buildComprobanteContableViewModel(
  result: VisualReportResult,
  generatedBy = ''
): ComprobanteContableViewModel {
  const columns = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length > 0) {
    throw new Error(`Comprobante Contable is missing required columns: ${missing.join(', ')}.`);
  }

  const records = resultsetToRecords(result).sort(compareRecords);
  const batches = new Map<string, ComprobanteBatch>();
  const vouchers = new Map<string, ComprobanteVoucher>();

  for (const record of records) {
    const batchKey = requiredString(record, 'batch_key');
    const voucherNumber = requiredString(record, 'voucher_number');
    const groupCode = requiredString(record, 'group_code');
    const voucherKey = `${batchKey}\u0000${voucherNumber}`;

    let batch = batches.get(batchKey);
    if (!batch) {
      batch = {
        key: batchKey,
        sequence: requiredNumber(record, 'batch_sequence'),
        officeName: requiredString(record, 'office_name'),
        entryDate: formatDate(record.entry_date),
        vouchers: []
      };
      batches.set(batchKey, batch);
    }

    let voucher = vouchers.get(voucherKey);
    if (!voucher) {
      voucher = {
        sequence: requiredNumber(record, 'voucher_sequence'),
        number: voucherNumber,
        entryDate: formatDate(record.entry_date),
        officeName: requiredString(record, 'office_name'),
        auxiliaryName: requiredString(record, 'auxiliary_name'),
        statusName: requiredString(record, 'status_name'),
        concept: requiredString(record, 'voucher_concept'),
        groups: [],
        debitTotal: 0,
        creditTotal: 0
      };
      vouchers.set(voucherKey, voucher);
      batch.vouchers.push(voucher);
    }

    let group = voucher.groups[voucher.groups.length - 1];
    if (!group || group.code !== groupCode) {
      group = {
        code: groupCode,
        name: requiredString(record, 'group_name'),
        lines: []
      };
      voucher.groups.push(group);
    }

    const debit = money(record.debit);
    const credit = money(record.credit);
    if ((debit === 0) === (credit === 0)) {
      throw new Error(`Voucher ${voucherNumber} line ${record.line_sequence} must contain exactly one amount side.`);
    }
    group.lines.push({
      sequence: requiredNumber(record, 'line_sequence'),
      glCode: requiredString(record, 'gl_code'),
      glName: requiredString(record, 'gl_name'),
      sourceBranchCode: requiredString(record, 'source_branch_code'),
      description: requiredString(record, 'line_description'),
      debit,
      credit
    });
    voucher.debitTotal = cents(voucher.debitTotal + debit);
    voucher.creditTotal = cents(voucher.creditTotal + credit);
  }

  for (const voucher of vouchers.values()) {
    if (voucher.debitTotal !== voucher.creditTotal) {
      throw new Error(
        `Voucher ${voucher.number} is unbalanced: ${voucher.debitTotal.toFixed(2)} / ${voucher.creditTotal.toFixed(2)}.`
      );
    }
  }

  return {
    organizationName: 'CREDESAL S.C. DE R.L. DE C.V.',
    title: 'Comprobante Contable',
    currencyLabel: 'Cifras en Dólares de los Estados Unidos de Norte América ($)',
    generatedOn: formatDate(new Date()),
    generatedBy,
    batches: [...batches.values()].sort((a, b) => a.sequence - b.sequence)
  };
}

function compareRecords(a: VisualReportRecord, b: VisualReportRecord): number {
  return (
    requiredNumber(a, 'batch_sequence') - requiredNumber(b, 'batch_sequence') ||
    requiredNumber(a, 'voucher_sequence') - requiredNumber(b, 'voucher_sequence') ||
    requiredNumber(a, 'line_sequence') - requiredNumber(b, 'line_sequence')
  );
}

function requiredString(record: VisualReportRecord, key: string): string {
  const value = optionalString(record[key]);
  if (!value) {
    throw new Error(`Comprobante Contable field ${key} is required.`);
  }
  return value;
}

function optionalString(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function requiredNumber(record: VisualReportRecord, key: string): number {
  const value = Number(record[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`Comprobante Contable field ${key} must be numeric.`);
  }
  return value;
}

function money(value: unknown): number {
  const number = value == null || value === '' ? 0 : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error('Comprobante Contable contains an invalid amount.');
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
  return optionalString(value);
}
