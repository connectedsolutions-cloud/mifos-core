import { VisualReportRecord, VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface PartidaLine {
  sequence: number;
  account: string;
  concept: string;
  branch: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface PartidaEntry {
  number: string;
  date: string;
  concept: string;
  description: string;
  status: string;
  branch: string;
  lines: PartidaLine[];
  debit: number;
  credit: number;
  lineCount: number;
}

export interface PartidaSegment {
  entry: PartidaEntry;
  lines: PartidaLine[];
  continued: boolean;
  showTotal: boolean;
}

export interface PartidaPage {
  number: number;
  branch: string;
  period: string;
  segments: PartidaSegment[];
}

export interface PartidaDocument {
  from: string;
  to: string;
  generatedBy: string;
  generatedOn: string;
  pages: PartidaPage[];
  entries: PartidaEntry[];
}

const REQUIRED = [
  'Orden',
  'Id Oficina',
  'Sucursal',
  'Partida',
  'Fecha',
  'Concepto Partida',
  'Estado',
  'Orden Línea',
  'No. Cuenta',
  'Concepto',
  'Sucursal Línea',
  'Cargos',
  'Abonos',
  'Saldo',
  'Total Cargos',
  'Total Abonos',
  'Saldo Partida',
  'Líneas Partida'
];
const PAGE_UNITS = 38;

export function buildPartidaDocument(
  result: VisualReportResult,
  generatedBy = '',
  selectedFrom = '',
  selectedTo = ''
): PartidaDocument {
  const headers = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = REQUIRED.filter((name) => !headers.has(name));
  if (missing.length) throw new Error(`Movimientos de Partidas: faltan columnas ${missing.join(', ')}.`);
  const records = resultsetToRecords(result);
  if (!records.length) throw new Error('No hay partidas para los filtros seleccionados.');

  const entries: PartidaEntry[] = [];
  let current: PartidaEntry | null = null;
  let lastOrder = 0;
  for (const row of records) {
    const order = requiredInteger(row, 'Orden');
    if (order <= lastOrder) throw new Error('El orden de las líneas no es válido.');
    lastOrder = order;
    const number = requiredText(row, 'Partida');
    const branch = requiredText(row, 'Sucursal');
    const date = isoDate(row['Fecha']);
    if (!current || current.number !== number || current.branch !== branch) {
      if (current) validateEntry(current);
      if (entries.some((entry) => entry.number === number && entry.branch === branch)) {
        throw new Error(`La partida ${number} aparece en bloques separados.`);
      }
      current = {
        number,
        branch,
        date,
        concept: requiredText(row, 'Concepto Partida'),
        description: text(row['Descripción Partida']),
        status: requiredText(row, 'Estado'),
        lines: [],
        debit: money(row['Total Cargos']),
        credit: money(row['Total Abonos']),
        lineCount: requiredInteger(row, 'Líneas Partida')
      };
      entries.push(current);
    } else if (
      current.date !== date ||
      current.concept !== requiredText(row, 'Concepto Partida') ||
      current.debit !== money(row['Total Cargos']) ||
      current.credit !== money(row['Total Abonos']) ||
      current.lineCount !== requiredInteger(row, 'Líneas Partida')
    ) {
      throw new Error(`La cabecera de la partida ${number} cambia entre líneas.`);
    }
    const sequence = requiredInteger(row, 'Orden Línea');
    if (current.lines.length && sequence <= current.lines[current.lines.length - 1].sequence) {
      throw new Error(`El orden de la partida ${number} no es válido.`);
    }
    const line: PartidaLine = {
      sequence,
      account: requiredText(row, 'No. Cuenta'),
      concept: requiredText(row, 'Concepto'),
      branch: requiredText(row, 'Sucursal Línea'),
      debit: money(row['Cargos']),
      credit: money(row['Abonos']),
      balance: signedMoney(row['Saldo'])
    };
    if (
      line.debit > 0 === line.credit > 0 &&
      !(current.status === 'INCOMPLETA' && line.debit === 0 && line.credit === 0)
    )
      throw new Error(`La partida ${number} contiene una línea sin lado contable único.`);
    const previous = current.lines.length ? current.lines[current.lines.length - 1].balance : 0;
    if (cents(previous + line.debit - line.credit) !== line.balance) {
      throw new Error(`El saldo progresivo de la partida ${number} no cuadra.`);
    }
    current.lines.push(line);
    if (
      current.lines.length > current.lineCount ||
      signedMoney(row['Saldo Partida']) !== cents(current.debit - current.credit)
    ) {
      throw new Error(`La partida ${number} no cuadra con sus totales.`);
    }
  }
  if (current) validateEntry(current);
  const dates = entries.map((entry) => entry.date).sort();
  return {
    from: displayDate(selectedFrom ? isoDate(selectedFrom) : dates[0]),
    to: displayDate(selectedTo ? isoDate(selectedTo) : dates[dates.length - 1]),
    generatedBy,
    generatedOn: new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
    pages: paginate(entries),
    entries
  };
}

function validateEntry(entry: PartidaEntry): void {
  const exceptional = entry.status === 'DESCUADRADA' || entry.status === 'INCOMPLETA';
  if (entry.lines.length !== entry.lineCount || (!exceptional && entry.lines.length < 2))
    throw new Error(`La partida ${entry.number} no contiene las líneas necesarias.`);
  const debit = cents(entry.lines.reduce((sum, line) => sum + line.debit, 0));
  const credit = cents(entry.lines.reduce((sum, line) => sum + line.credit, 0));
  if (
    debit !== entry.debit ||
    credit !== entry.credit ||
    (!exceptional && debit !== credit) ||
    entry.lines[entry.lines.length - 1].balance !== cents(debit - credit)
  ) {
    throw new Error(`Los totales de la partida ${entry.number} no cuadran.`);
  }
}

function paginate(entries: PartidaEntry[]): PartidaPage[] {
  const pages: PartidaPage[] = [];
  let page: PartidaPage | null = null;
  let used = 0;
  const nextPage = (entry: PartidaEntry): void => {
    page = { number: pages.length + 1, branch: entry.branch, period: periodLabel(entry.date), segments: [] };
    pages.push(page);
    used = 0;
  };
  for (const entry of entries) {
    if (!page || page.branch !== entry.branch || page.period !== periodLabel(entry.date)) nextPage(entry);
    let offset = 0;
    while (offset < entry.lines.length) {
      const overhead = 4;
      if (PAGE_UNITS - used < overhead + 2) nextPage(entry);
      const room = PAGE_UNITS - used - overhead;
      let count = 0;
      let cost = 0;
      while (offset + count < entry.lines.length) {
        const line = entry.lines[offset + count];
        const unit = line.concept.length > 42 ? 2 : 1;
        if (count && cost + unit > room - 1) break;
        if (!count && cost + unit > room) break;
        cost += unit;
        count++;
      }
      if (!count) {
        nextPage(entry);
        continue;
      }
      const showTotal = offset + count === entry.lines.length;
      page!.segments.push({
        entry,
        lines: entry.lines.slice(offset, offset + count),
        continued: offset > 0,
        showTotal
      });
      used += overhead + cost + (showTotal ? 1 : 0);
      offset += count;
      if (!showTotal) nextPage(entry);
    }
  }
  return pages;
}

function text(value: unknown): string {
  return String(value ?? '').trim();
}
function requiredText(row: VisualReportRecord, key: string): string {
  const value = text(row[key]);
  if (!value) throw new Error(`El campo ${key} es obligatorio.`);
  return value;
}
function requiredInteger(row: VisualReportRecord, key: string): number {
  const value = Number(row[key]);
  if (!Number.isInteger(value) || value < 1) throw new Error(`El campo ${key} no es válido.`);
  return value;
}
function cents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
function signedMoney(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('El reporte contiene un importe inválido.');
  return cents(number);
}
function money(value: unknown): number {
  const number = signedMoney(value);
  if (number < 0) throw new Error('El reporte contiene un importe negativo en cargos o abonos.');
  return number;
}
function isoDate(value: unknown): string {
  const iso = Array.isArray(value)
    ? `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`
    : String(value).slice(0, 10);
  const date = new Date(`${iso}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) {
    throw new Error('La fecha de la partida no es válida.');
  }
  return iso;
}
function displayDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function periodLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${date.getUTCFullYear()} - ${new Intl.DateTimeFormat('es-SV', { month: 'long', timeZone: 'UTC' }).format(date).toUpperCase()}`;
}
