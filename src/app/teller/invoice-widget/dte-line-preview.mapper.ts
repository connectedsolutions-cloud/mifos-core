import { DtePrintInvoice } from './dte-print-pdf.service';

export interface MhDtePreviewLine {
  mappingName?: string;
  source?: string;
  amount?: number | string;
  dteAmountType?: string;
}

export interface DteLineAmountRow {
  cantidad: number;
  descripcion: string;
  precioUni: number;
  noGravado: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
}

/** Same mapping as teller invoice popup (`InvoiceWidgetComponent.mapPreviewLineToRow`). */
export function mapPreviewLineToRow(line: MhDtePreviewLine): DteLineAmountRow {
  const amount = Number(line.amount) || 0;
  const type = line.dteAmountType ?? '';
  return {
    cantidad: 1,
    descripcion: (line.mappingName || line.source || '').trim() || '—',
    precioUni: amount,
    noGravado: type === 'noGravado' || type === 'psv' ? amount : 0,
    ventaNoSuj: type === 'ventaNoSuj' ? amount : 0,
    ventaExenta: type === 'ventaExenta' ? amount : 0,
    ventaGravada: type === 'ventaGravada' ? amount : 0
  };
}

export function mapPreviewLinesToInvoiceLines(previewLines: MhDtePreviewLine[]): NonNullable<DtePrintInvoice['lines']> {
  return previewLines.map((line, index) => {
    const row = mapPreviewLineToRow(line);
    return {
      numItem: index + 1,
      descripcion: row.descripcion,
      cantidad: row.cantidad,
      precioUni: row.precioUni,
      ventaGravada: row.ventaGravada,
      ventaExenta: row.ventaExenta,
      ventaNoSuj: row.ventaNoSuj,
      noGravado: row.noGravado
    };
  });
}

export interface DtePrintLineTotals {
  totalGravada: number;
  totalExenta: number;
  totalNoSuj: number;
  totalNoGravado: number;
  subTotal: number;
  montoTotalOperacion: number;
  totalPagar: number;
}

/** Sum each DETALLE column; total a pagar = gravada + exenta + no sujeta + no gravado. */
export function summarizeDtePrintLines(lines: NonNullable<DtePrintInvoice['lines']> | undefined): DtePrintLineTotals {
  const items = lines ?? [];
  let totalGravada = 0;
  let totalExenta = 0;
  let totalNoSuj = 0;
  let totalNoGravado = 0;

  for (const line of items) {
    totalGravada += Number(line.ventaGravada) || 0;
    totalExenta += Number(line.ventaExenta) || 0;
    totalNoSuj += Number(line.ventaNoSuj) || 0;
    totalNoGravado += Number(line.noGravado) || 0;
  }

  const subTotal = totalGravada + totalExenta + totalNoSuj + totalNoGravado;
  return {
    totalGravada,
    totalExenta,
    totalNoSuj,
    totalNoGravado,
    subTotal,
    montoTotalOperacion: subTotal,
    totalPagar: subTotal
  };
}

export function enrichInvoiceWithLineTotals<T extends DtePrintInvoice>(
  invoice: T,
  lines: NonNullable<DtePrintInvoice['lines']>
): T {
  if (!lines.length) {
    return invoice;
  }
  return { ...invoice, ...summarizeDtePrintLines(lines) };
}

/** Prefer MH DTE item preview for loan invoices (matches teller popup table). */
export function resolveInvoiceLinesForPrint(
  invoice: DtePrintInvoice,
  linePreview: { lines?: MhDtePreviewLine[] } | null | undefined,
  isLoanTransaction: boolean
): NonNullable<DtePrintInvoice['lines']> {
  const previewLines = isLoanTransaction && Array.isArray(linePreview?.lines) ? linePreview.lines : [];
  if (previewLines.length > 0) {
    return mapPreviewLinesToInvoiceLines(previewLines);
  }
  return invoice.lines ?? [];
}
