import { VisualReportRecord, VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface DailyMovementAccount {
  code: string;
  description: string;
  debit: number;
  credit: number;
}

export interface DailyMovementBranch {
  officeId: number;
  code: string;
  name: string;
  accounts: DailyMovementAccount[];
  debitTotal: number;
  creditTotal: number;
}

export interface DailyMovementDocument {
  reportDate: string;
  period: string;
  generatedOn: string;
  generatedBy: string;
  branches: DailyMovementBranch[];
  debitTotal: number;
  creditTotal: number;
}

const REQUIRED_COLUMNS = [
  'Orden',
  'Tipo Fila',
  'Id Oficina',
  'Código Sucursal',
  'Sucursal',
  'Cuenta',
  'Concepto',
  'Cargos',
  'Abonos',
  'Fecha'
] as const;

export function buildDailyMovementDocument(result: VisualReportResult, generatedBy = ''): DailyMovementDocument {
  const columns = new Set((result?.columnHeaders ?? []).map((column) => column.columnName));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length) throw new Error(`Concentración de Movimientos Diarios: faltan columnas ${missing.join(', ')}.`);

  const records = resultsetToRecords(result);
  if (!records.length) throw new Error('Concentración de Movimientos Diarios no contiene filas.');

  const branches: DailyMovementBranch[] = [];
  const seenOffices = new Set<number>();
  let current: DailyMovementBranch | null = null;
  let reportDate = '';
  let grandDebit: number | null = null;
  let grandCredit: number | null = null;
  let lastSequence = 0;

  for (const record of records) {
    const sequence = requiredNumber(record, 'Orden');
    if (!Number.isInteger(sequence) || sequence <= lastSequence) throw new Error('El orden de las filas no es válido.');
    lastSequence = sequence;

    const date = parseDate(record['Fecha']);
    if (reportDate && date.iso !== reportDate) throw new Error('El reporte contiene fechas diferentes.');
    reportDate = date.iso;
    const type = requiredString(record, 'Tipo Fila');
    const debit = money(record['Cargos']);
    const credit = money(record['Abonos']);

    if (type === 'TOTAL_GENERAL') {
      if (grandDebit !== null || branches.length === 0 || current) {
        throw new Error('El total general está duplicado o fuera de orden.');
      }
      grandDebit = debit;
      grandCredit = credit;
      continue;
    }
    if (grandDebit !== null) throw new Error('Hay filas después del total general.');

    const officeId = requiredNumber(record, 'Id Oficina');
    if (!Number.isInteger(officeId) || officeId <= 0) throw new Error('La oficina no es válida.');
    const code = requiredString(record, 'Código Sucursal');
    const name = requiredString(record, 'Sucursal');

    if (type === 'CUENTA') {
      if (!current) {
        if (seenOffices.has(officeId)) throw new Error(`La sucursal ${name} aparece en bloques separados.`);
        current = { officeId, code, name, accounts: [], debitTotal: 0, creditTotal: 0 };
        seenOffices.add(officeId);
      }
      if (current.officeId !== officeId || current.code !== code || current.name !== name) {
        throw new Error('Falta el total de la sucursal anterior.');
      }
      const accountCode = requiredString(record, 'Cuenta');
      if (!/^\d{3}$/.test(accountCode) || current.accounts.some((account) => account.code === accountCode)) {
        throw new Error(`La cuenta ${accountCode} está duplicada o no es una familia de tres dígitos.`);
      }
      current.accounts.push({ code: accountCode, description: requiredString(record, 'Concepto'), debit, credit });
      current.debitTotal = cents(current.debitTotal + debit);
      current.creditTotal = cents(current.creditTotal + credit);
      continue;
    }

    if (type === 'TOTAL_SUCURSAL') {
      if (
        !current ||
        !current.accounts.length ||
        current.officeId !== officeId ||
        current.code !== code ||
        current.name !== name
      ) {
        throw new Error('El total de sucursal no corresponde a sus cuentas.');
      }
      if (debit !== current.debitTotal || credit !== current.creditTotal) {
        throw new Error(`Los totales de ${name} no cuadran con sus cuentas.`);
      }
      branches.push(current);
      current = null;
      continue;
    }
    throw new Error(`Tipo de fila no admitido: ${type}.`);
  }

  if (current || grandDebit === null || grandCredit === null)
    throw new Error('Faltan totales de sucursal o el total general.');
  if (
    grandDebit !== cents(branches.reduce((sum, branch) => sum + branch.debitTotal, 0)) ||
    grandCredit !== cents(branches.reduce((sum, branch) => sum + branch.creditTotal, 0))
  ) {
    throw new Error('El total general no cuadra con las sucursales.');
  }

  const date = parseDate(reportDate);
  return {
    reportDate: date.display,
    period: `${new Intl.DateTimeFormat('es-SV', { month: 'long', timeZone: 'UTC' }).format(date.value).toUpperCase()} - ${date.value.getUTCFullYear()}`,
    generatedOn: new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
    generatedBy,
    branches,
    debitTotal: grandDebit,
    creditTotal: grandCredit
  };
}

function requiredString(record: VisualReportRecord, key: string): string {
  const value = record[key] == null ? '' : String(record[key]).trim();
  if (!value) throw new Error(`El campo ${key} es obligatorio.`);
  return value;
}

function requiredNumber(record: VisualReportRecord, key: string): number {
  const value = record[key];
  if (value == null || value === '') throw new Error(`El campo ${key} es obligatorio.`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`El campo ${key} debe ser numérico.`);
  return number;
}

function money(value: unknown): number {
  const number = value == null || value === '' ? NaN : Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('El reporte contiene un importe no válido.');
  return cents(number);
}

function cents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseDate(value: unknown): { iso: string; display: string; value: Date } {
  let iso: string;
  if (Array.isArray(value) && value.length >= 3) {
    iso = `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
  } else {
    iso = String(value ?? '').slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error('La fecha del reporte no es válida.');
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) {
    throw new Error('La fecha del reporte no es válida.');
  }
  return { iso, display: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`, value: date };
}
