import moment from 'moment';

/** Fixed insurer metadata for Reporte Seguro exports. */
export const REPORTE_SEGURO_CONTRACT_HOLDER = 'CREDESAL S.A. DE C.V. DE R.L.';
export const REPORTE_SEGURO_POLICY_NUMBER = 'CD-00157';
export const REPORTE_SEGURO_REPORT_NAME = 'Reporte Seguro';

const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

export const REPORTE_SEGURO_MONETARY_HEADERS = new Set([
  'MONTO OTORGADO',
  'SALDO CAPITAL',
  'INTERESES POR PAGAR',
  'SUMA ASEGURADA',
  'EXTRA PRIMA'
]);

export const REPORTE_SEGURO_TOTAL_HEADERS = new Set([
  'MONTO OTORGADO',
  'SALDO CAPITAL',
  'INTERESES POR PAGAR',
  'SUMA ASEGURADA'
]);

export const REPORTE_SEGURO_TEXT_HEADERS = new Set([
  'NO. CREDITO',
  'DUI',
  'PASAPORTE',
  'CARNE RESIDENTE',
  'NIT (Persona Juridica)',
  'Telefono movil',
  'Telefono fijo'
]);

export function isReporteSeguro(reportName: string | null | undefined): boolean {
  return (reportName || '').trim().toLowerCase() === REPORTE_SEGURO_REPORT_NAME.toLowerCase();
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

export function toReporteSeguroMoment(value: unknown): moment.Moment | null {
  if (value == null || value === '') {
    return null;
  }
  if (moment.isMoment(value)) {
    return value.isValid() ? value : null;
  }
  if (value instanceof Date) {
    const m = moment(value);
    return m.isValid() ? m : null;
  }
  const asString = String(value).trim();
  const parsed = moment(
    asString,
    [
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'DD MMMM YYYY',
      moment.ISO_8601
    ],
    true
  );
  if (parsed.isValid()) {
    return parsed;
  }
  const loose = moment(asString);
  return loose.isValid() ? loose : null;
}

/** Builds the third metadata line from declaration period dates. */
export function buildReporteSeguroPeriodLine(startDate: unknown, endDate: unknown): string {
  const start = toReporteSeguroMoment(startDate);
  const end = toReporteSeguroMoment(endDate) || start;
  if (!start || !end) {
    return 'Declaracion correspondiente al periodo:';
  }

  const startDay = pad2(start.date());
  const endDay = pad2(end.date());
  const sameMonthYear = start.month() === end.month() && start.year() === end.year();

  if (sameMonthYear) {
    const monthName = SPANISH_MONTHS[end.month()];
    return `Declaracion correspondiente al periodo: del ${startDay} al ${endDay} de ${monthName} ${end.year()}`;
  }

  const startMonth = SPANISH_MONTHS[start.month()];
  const endMonth = SPANISH_MONTHS[end.month()];
  return `Declaracion correspondiente al periodo: del ${startDay} de ${startMonth} ${start.year()} al ${endDay} de ${endMonth} ${end.year()}`;
}

export function buildReporteSeguroMetadataLines(startDate: unknown, endDate: unknown): string[] {
  return [
    `Contratante: ${REPORTE_SEGURO_CONTRACT_HOLDER}`,
    `Seguro de Deuda, Poliza No.: ${REPORTE_SEGURO_POLICY_NUMBER}`,
    buildReporteSeguroPeriodLine(startDate, endDate)];
}

export function parseReporteSeguroNumeric(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = String(value).replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function emptyToBlank(value: unknown): unknown {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'null') {
    return '';
  }
  return value;
}

export interface ReporteSeguroExportInput {
  columns: string[];
  /** Each item is either a flat row object keyed by column, or `{ row: any[] }` API shape. */
  rows: any[];
  startDate: unknown;
  endDate: unknown;
}

export function normalizeReporteSeguroRows(columns: string[], rows: any[]): Record<string, any>[] {
  return rows.map((item) => {
    if (item && Array.isArray(item.row)) {
      const mapped: Record<string, any> = {};
      columns.forEach((col, index) => {
        mapped[col] = emptyToBlank(item.row[index]);
      });
      return mapped;
    }
    const mapped: Record<string, any> = {};
    columns.forEach((col) => {
      mapped[col] = emptyToBlank(item?.[col]);
    });
    return mapped;
  });
}

/** Builds CSV text with the same three metadata lines as the Excel export. */
export function buildReporteSeguroCsv(input: ReporteSeguroExportInput, delimiter: string): string {
  const columns = input.columns;
  const dataRows = normalizeReporteSeguroRows(columns, input.rows);
  const metadata = buildReporteSeguroMetadataLines(input.startDate, input.endDate);
  const lines: string[] = metadata.map((line) => line);
  lines.push('');
  lines.push(columns.join(delimiter));

  dataRows.forEach((rowObj) => {
    lines.push(
      columns
        .map((col) => {
          const value = rowObj[col];
          if (value == null || value === '') {
            return '';
          }
          const asString = String(value);
          if (asString.includes(delimiter) || asString.includes('"') || asString.includes('\n')) {
            return `"${asString.replace(/"/g, '""')}"`;
          }
          return asString;
        })
        .join(delimiter)
    );
  });

  const totals = columns.map((col, index) => {
    if (index === 0) {
      return 'TOTAL';
    }
    if (REPORTE_SEGURO_TOTAL_HEADERS.has(col)) {
      const sum = dataRows.reduce((acc, row) => acc + parseReporteSeguroNumeric(row[col]), 0);
      return sum.toFixed(2);
    }
    return '';
  });
  lines.push(totals.join(delimiter));

  return lines.join('\r\n');
}

export function downloadBlob(bufferOrText: ArrayBuffer | string, fileName: string, mimeType: string): void {
  const blob =
    typeof bufferOrText === 'string'
      ? new Blob([bufferOrText], { type: mimeType })
      : new Blob([bufferOrText], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export function resolveReportPeriodDates(formData: Record<string, any> | null | undefined): {
  startDate: unknown;
  endDate: unknown;
} {
  if (!formData) {
    return { startDate: null, endDate: null };
  }
  return {
    startDate: formData['R_startDate'] ?? formData['startDate'] ?? null,
    endDate: formData['R_endDate'] ?? formData['endDate'] ?? null
  };
}
