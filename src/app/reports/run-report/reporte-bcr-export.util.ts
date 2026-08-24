import moment from 'moment';

export const REPORTE_BCR_REPORT_NAME = 'Reporte BCR';
export const REPORTE_BCR_INSTITUTION = 'CREDESAL S.C. DE R.L. DE C.V.';

export const REPORTE_BCR_COLUMNS = [
  'No Prestamo',
  'Clsf',
  'Nombre',
  'Monto Aprobado',
  'Fecha Otorga.',
  'Fecha Venci.',
  'Ultimo Pago',
  'Monto Desemb.',
  'Saldo',
  'Plazo',
  'Tasa % Interes',
  'Cuota K+I',
  'Cuota Total',
  'Cargos Desembolso',
  'Cargos Cuota',
  'TEA %',
  'TEA % Maxima',
  'Cumplimiento'
] as const;

export const REPORTE_BCR_MONEY_COLUMNS = new Set([
  'Monto Aprobado',
  'Monto Desemb.',
  'Saldo',
  'Cuota K+I',
  'Cuota Total',
  'Cargos Desembolso',
  'Cargos Cuota'
]);

export const REPORTE_BCR_TOTAL_COLUMNS = new Set([
  'Monto Aprobado',
  'Monto Desemb.',
  'Saldo',
  'Cargos Desembolso',
  'Cargos Cuota'
]);

export const REPORTE_BCR_DATE_COLUMNS = new Set([
  'Fecha Otorga.',
  'Fecha Venci.',
  'Ultimo Pago'
]);
export const REPORTE_BCR_PERCENT_COLUMNS = new Set([
  'Tasa % Interes',
  'TEA %',
  'TEA % Maxima'
]);

const SPANISH_MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE'
];

export interface ReporteBcrMetadata {
  institution: string;
  currency: string;
  reportingPeriod: string;
  office: string;
  segment: string;
  creditLine: string;
  issuanceDate: Date;
}

export interface ReporteBcrExportInput {
  columns: string[];
  /** Each item is either a flat row object keyed by column, or the `{ row: any[] }` report API shape. */
  rows: any[];
  metadata: ReporteBcrMetadata;
}

interface ReportParameterLike {
  name: string;
  variable: string;
}

export function isReporteBcr(reportName: string | null | undefined): boolean {
  return (reportName || '').trim().toLowerCase() === REPORTE_BCR_REPORT_NAME.toLowerCase();
}

export function toReporteBcrMoment(value: unknown): moment.Moment | null {
  if (value == null || value === '') {
    return null;
  }
  if (moment.isMoment(value)) {
    return value.isValid() ? value : null;
  }
  if (value instanceof Date) {
    const parsedDate = moment(value);
    return parsedDate.isValid() ? parsedDate : null;
  }
  const parsed = moment(
    String(value).trim(),
    [
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      moment.ISO_8601
    ],
    true
  );
  return parsed.isValid() ? parsed : null;
}

export function parseReporteBcrNumeric(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyToBlank(value: unknown): unknown {
  if (value == null || (typeof value === 'string' && value.trim().toLowerCase() === 'null')) {
    return '';
  }
  return value;
}

export function normalizeReporteBcrRows(columns: string[], rows: any[]): Record<string, any>[] {
  return rows.map((item) => {
    const mapped: Record<string, any> = {};
    columns.forEach((column, index) => {
      mapped[column] = emptyToBlank(Array.isArray(item?.row) ? item.row[index] : item?.[column]);
    });
    return mapped;
  });
}

function selectedValue(value: any, preferId = false): string {
  if (value == null || value === '') {
    return 'TODOS';
  }
  if (Array.isArray(value)) {
    return value.map((entry) => selectedValue(entry, preferId)).join(', ');
  }
  if (typeof value === 'object') {
    const selected = preferId ? (value.id ?? value.name) : (value.name ?? value.id);
    return selected == null || selected === '-1' ? 'TODOS' : String(selected).trim();
  }
  return String(value) === '-1' ? 'TODOS' : String(value).trim();
}

function reportValue(
  parameters: ReportParameterLike[],
  formValue: Record<string, any>,
  variable: string,
  preferId = false
): string {
  const parameter = parameters.find((entry) => entry.variable === variable);
  return parameter ? selectedValue(formValue[parameter.name], preferId) : 'TODOS';
}

export function buildReporteBcrPeriod(endDate: unknown): string {
  const end = toReporteBcrMoment(endDate);
  return end ? `${end.year()} - ${SPANISH_MONTHS[end.month()]}` : '';
}

/** Resolves human-readable header metadata from the selected report controls. */
export function resolveReporteBcrMetadata(
  parameters: ReportParameterLike[],
  formValue: Record<string, any>,
  issuanceDate: Date = new Date()
): ReporteBcrMetadata {
  const endDateParameter = parameters.find((entry) => entry.variable === 'endDate');
  return {
    institution: REPORTE_BCR_INSTITUTION,
    currency: reportValue(parameters, formValue, 'currencyId', true),
    reportingPeriod: buildReporteBcrPeriod(endDateParameter ? formValue[endDateParameter.name] : null),
    office: reportValue(parameters, formValue, 'officeId'),
    segment: reportValue(parameters, formValue, 'slu', true),
    creditLine: reportValue(parameters, formValue, 'loanProductId'),
    issuanceDate
  };
}
