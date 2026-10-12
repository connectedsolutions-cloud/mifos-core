import { VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface LoanArrearsRow {
  type: string;
  term: string;
  office: string;
  product: string;
  classification: string;
  loans: number;
  loansInArrears: number;
  disbursed: number;
  principal: number;
  affected: number;
  overduePrincipal: number;
  overdueInterest: number;
  currentPortfolio: number;
  overduePortfolio: number;
  portfolioPercent: number;
  overduePercent: number;
  showTerm: boolean;
  showOffice: boolean;
  showProduct: boolean;
}

export interface LoanArrearsDocument {
  period: string;
  cutoff: string;
  generatedBy: string;
  generatedOn: string;
  rows: LoanArrearsRow[];
}

const COLUMNS = [
  'Orden',
  'Tipo Fila',
  'Tipo Plazo',
  'Sucursal',
  'Línea Crédito',
  'CLSF',
  'Cantidad Préstamos',
  'Cantidad Préstamos en Mora',
  'Monto Desembolsado',
  'Saldo Capital',
  'Cartera Afectada',
  'Capital Vencido',
  'Interés Vencido',
  'Cartera Vigente',
  'Cartera Vencida',
  'Porcentaje Cartera %',
  'Porcentaje Vencido %',
  'Fecha Corte',
  'Período'
] as const;

const NUMBERS: { key: (typeof COLUMNS)[number]; property: keyof LoanArrearsRow }[] = [
  { key: 'Cantidad Préstamos', property: 'loans' },
  { key: 'Cantidad Préstamos en Mora', property: 'loansInArrears' },
  { key: 'Monto Desembolsado', property: 'disbursed' },
  { key: 'Saldo Capital', property: 'principal' },
  { key: 'Cartera Afectada', property: 'affected' },
  { key: 'Capital Vencido', property: 'overduePrincipal' },
  { key: 'Interés Vencido', property: 'overdueInterest' },
  { key: 'Cartera Vigente', property: 'currentPortfolio' },
  { key: 'Cartera Vencida', property: 'overduePortfolio' },
  { key: 'Porcentaje Cartera %', property: 'portfolioPercent' },
  { key: 'Porcentaje Vencido %', property: 'overduePercent' }
];

const ROW_TYPES = new Set([
  'CLASIFICACION',
  'TOTAL_LINEA',
  'TOTAL_SUCURSAL',
  'TOTAL_PLAZO',
  'TOTAL_GENERAL'
]);

export function buildLoanArrearsDocument(result: VisualReportResult, generatedBy = ''): LoanArrearsDocument {
  const columns = new Set((result?.columnHeaders ?? []).map((column) => column.columnName));
  const missing = COLUMNS.filter((column) => !columns.has(column));
  if (missing.length) throw new Error(`Faltan columnas del reporte: ${missing.join(', ')}.`);

  const records = resultsetToRecords(result);
  if (!records.length) throw new Error('No hay préstamos para el período y las oficinas seleccionadas.');

  const rows: LoanArrearsRow[] = [];
  let period = '';
  let cutoff = '';
  let previousSequence = 0;
  let previousTerm = '';
  let previousOffice = '';
  let previousProduct = '';

  for (const record of records) {
    const sequence = number(record['Orden'], 'Orden');
    if (!Number.isInteger(sequence) || sequence <= previousSequence)
      throw new Error('El orden del reporte no es válido.');
    previousSequence = sequence;

    const type = String(record['Tipo Fila'] ?? '');
    if (!ROW_TYPES.has(type)) throw new Error(`Tipo de fila no reconocido: ${type}.`);
    const rowPeriod = String(record['Período'] ?? '');
    const rowCutoff = date(record['Fecha Corte']);
    if (!/^\d{4}-\d{2}$/.test(rowPeriod) || (period && rowPeriod !== period) || (cutoff && rowCutoff !== cutoff)) {
      throw new Error('El reporte contiene períodos o fechas de corte diferentes.');
    }
    period = rowPeriod;
    cutoff = rowCutoff;

    const term = String(record['Tipo Plazo'] ?? '');
    const office = String(record['Sucursal'] ?? '');
    const product = String(record['Línea Crédito'] ?? '');
    const row: LoanArrearsRow = {
      type,
      term,
      office,
      product,
      classification: String(record['CLSF'] ?? ''),
      loans: 0,
      loansInArrears: 0,
      disbursed: 0,
      principal: 0,
      affected: 0,
      overduePrincipal: 0,
      overdueInterest: 0,
      currentPortfolio: 0,
      overduePortfolio: 0,
      portfolioPercent: 0,
      overduePercent: 0,
      showTerm: type === 'CLASIFICACION' && term !== previousTerm,
      showOffice: type === 'CLASIFICACION' && (term !== previousTerm || office !== previousOffice),
      showProduct:
        type === 'CLASIFICACION' && (term !== previousTerm || office !== previousOffice || product !== previousProduct)
    };
    for (const field of NUMBERS) {
      (row as unknown as Record<string, unknown>)[field.property] = number(record[field.key], field.key);
    }
    if (
      row.loans < 0 ||
      row.loansInArrears < 0 ||
      !Number.isInteger(row.loans) ||
      !Number.isInteger(row.loansInArrears)
    ) {
      throw new Error('El reporte contiene conteos de préstamos no válidos.');
    }
    if (type === 'CLASIFICACION') {
      if (!term || !office || !product || !row.classification) throw new Error('Faltan grupos de clasificación.');
      previousTerm = term;
      previousOffice = office;
      previousProduct = product;
    }
    rows.push(row);
  }

  const grand = rows.filter((row) => row.type === 'TOTAL_GENERAL');
  if (grand.length !== 1 || rows[rows.length - 1] !== grand[0]) throw new Error('Falta el total general del reporte.');
  const terms = rows.filter((row) => row.type === 'TOTAL_PLAZO');
  if (!terms.length || sum(terms.map((row) => row.loans)) !== grand[0].loans) {
    throw new Error('Los totales por plazo no cuadran con el total general.');
  }
  if (Math.abs(sum(terms.map((row) => row.principal)) - grand[0].principal) > 0.02) {
    throw new Error('El saldo por plazo no cuadra con el total general.');
  }

  return {
    period,
    cutoff,
    generatedBy,
    generatedOn: new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
    rows
  };
}

function number(value: unknown, name: string): number {
  const parsed = value == null || value === '' ? NaN : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`El valor de ${name} no es válido.`);
  return parsed;
}

function date(value: unknown): string {
  const iso = Array.isArray(value)
    ? `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`
    : String(value ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(`${iso}T00:00:00Z`))) {
    throw new Error('La fecha de corte no es válida.');
  }
  return iso;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
