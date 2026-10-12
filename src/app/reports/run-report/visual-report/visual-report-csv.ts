import { VisualReportResult } from './visual-report-result';

/** Export the complete Fineract result contract, including control and subtotal rows. */
export function visualReportCsv(result: VisualReportResult): string {
  const headers = (result?.columnHeaders ?? []).map((header) => header.columnName);
  if (!headers.length || new Set(headers).size !== headers.length) {
    throw new Error('El reporte no tiene columnas CSV válidas.');
  }

  const lines = [headers.map(csvCell).join(',')];
  for (const [
    index,
    entry
  ] of (result?.data ?? []).entries()) {
    if (!Array.isArray(entry.row) || entry.row.length !== headers.length) {
      throw new Error(`La fila ${index + 1} no coincide con las columnas del reporte.`);
    }
    lines.push(entry.row.map(csvCell).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function csvCell(value: unknown): string {
  let formatted: string;
  if (value == null) {
    formatted = '';
  } else if (Array.isArray(value) && value.length === 3 && value.every(Number.isInteger)) {
    formatted = `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
  } else if (typeof value === 'object') {
    formatted = JSON.stringify(value);
  } else {
    formatted = String(value);
  }

  // Keep user-entered text from being evaluated as a spreadsheet formula.
  if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(formatted)) {
    formatted = `'${formatted}`;
  }
  return `"${formatted.replace(/"/g, '""')}"`;
}
