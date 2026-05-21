import { summarizeDtePrintLines } from './dte-line-preview.mapper';
import { buildMhConsultaUrl, DtePrintInvoice, mapTipoDteToTitle } from './dte-print-pdf.service';
import { displayValue, formatAddress, formatAmount, formatEmission, joinParts, money } from './dte-print-formatters';

export interface DtePrintFieldRow {
  label: string;
  value: string;
  /** When set, field renders in the right column of a 2-column receptor grid. */
  column?: 2;
}

export interface DtePrintLineRow {
  numItem: string;
  descripcion: string;
  cantidad: string;
  precioUni: string;
  ventaGravada: string;
  ventaExenta: string;
  ventaNoSuj: string;
  noGravado: string;
}

export interface DtePrintTotalRow {
  label: string;
  value: string;
}

export interface DtePrintViewModel {
  documentTitle: string;
  qrUrl: string;
  emission: string;
  identification: DtePrintFieldRow[];
  emisor: DtePrintFieldRow[];
  receptor: DtePrintFieldRow[];
  lines: DtePrintLineRow[];
  totals: DtePrintTotalRow[];
  totalLetras?: string;
  currencyCode: string;
}

export function buildDtePrintViewModel(
  invoice: DtePrintInvoice,
  currencyCode = 'USD',
  linesOverride?: DtePrintInvoice['lines']
): DtePrintViewModel {
  const sourceLines = linesOverride ?? invoice.lines ?? [];
  const lineTotals = sourceLines.length > 0 ? summarizeDtePrintLines(sourceLines) : null;
  const lines = sourceLines.map((line) => ({
    numItem: String(line.numItem ?? ''),
    descripcion: line.descripcion ?? '',
    cantidad: formatAmount(line.cantidad),
    precioUni: money(line.precioUni, currencyCode),
    ventaGravada: money(line.ventaGravada, currencyCode),
    ventaExenta: money(line.ventaExenta, currencyCode),
    ventaNoSuj: money(line.ventaNoSuj, currencyCode),
    noGravado: money(line.noGravado, currencyCode)
  }));

  return {
    documentTitle: mapTipoDteToTitle(invoice.tipoDte),
    qrUrl: buildMhConsultaUrl(invoice),
    emission: formatEmission(invoice),
    currencyCode,
    identification: [
      { label: 'Número de control', value: displayValue(invoice.numeroControl) },
      { label: 'Código de generación', value: displayValue(invoice.codigoGeneracion) },
      { label: 'Fecha / hora emisión', value: formatEmission(invoice) },
      { label: 'Sello de recepción', value: displayValue(invoice.selloRecibido) }
    ],
    emisor: [
      { label: 'Nombre', value: displayValue(invoice.emisorNombre) },
      { label: 'NIT', value: displayValue(invoice.emisorNit) },
      { label: 'NRC', value: displayValue(invoice.emisorNrc) },
      { label: 'Actividad', value: joinParts(invoice.emisorCodActividad, invoice.emisorDescActividad) },
      {
        label: 'Dirección',
        value: formatAddress(
          invoice.emisorDireccionComplemento,
          invoice.emisorDireccionMunicipio,
          invoice.emisorDireccionDepartamento
        )
      },
      { label: 'Teléfono', value: displayValue(invoice.emisorTelefono) },
      { label: 'Correo', value: displayValue(invoice.emisorCorreo) }
    ],
    receptor: [
      { label: 'Nombre', value: displayValue(invoice.receptorNombre) },
      { label: 'Documento', value: displayValue(invoice.receptorDocId) },
      { label: 'NIT', value: displayValue(invoice.receptorNit) },
      { label: 'NRC', value: displayValue(invoice.receptorNrc) },
      { label: 'Dirección', value: displayValue(invoice.receptorDireccionComplemento) },
      { label: 'Teléfono', value: displayValue(invoice.receptorTelefono) },
      { label: 'Correo', value: displayValue(invoice.receptorCorreo) },
      { label: 'Línea crediticia', value: displayValue(invoice.lineaCrediticia) },
      { label: 'No. crédito', value: displayValue(invoice.numeroCredito), column: 2 }
    ],
    lines: lines.length
      ? lines
      : [
          {
            numItem: '-',
            descripcion: 'Sin líneas',
            cantidad: '-',
            precioUni: '-',
            ventaGravada: '-',
            ventaExenta: '-',
            ventaNoSuj: '-',
            noGravado: '-'
          }
        ],
    totals: buildDtePrintTotals(lineTotals, invoice, currencyCode),
    totalLetras: invoice.totalLetras?.trim() || undefined
  };
}

function buildDtePrintTotals(
  fromLines: ReturnType<typeof summarizeDtePrintLines> | null,
  invoice: DtePrintInvoice,
  currencyCode: string
): DtePrintTotalRow[] {
  const t = fromLines ?? {
    totalGravada: invoice.totalGravada,
    totalExenta: invoice.totalExenta,
    totalNoSuj: invoice.totalNoSuj,
    totalNoGravado: 0,
    subTotal: invoice.subTotal,
    montoTotalOperacion: invoice.montoTotalOperacion,
    totalPagar: invoice.totalPagar
  };
  return [
    { label: 'Total gravada', value: money(t.totalGravada, currencyCode) },
    { label: 'Total exenta', value: money(t.totalExenta, currencyCode) },
    { label: 'Total no sujeta', value: money(t.totalNoSuj, currencyCode) },
    { label: 'Total no gravado', value: money(t.totalNoGravado, currencyCode) },
    { label: 'Subtotal', value: money(t.subTotal, currencyCode) },
    { label: 'Monto operación', value: money(t.montoTotalOperacion, currencyCode) },
    { label: 'Total a pagar', value: money(t.totalPagar, currencyCode) }
  ];
}

export function buildSampleDtePrintInvoice(): DtePrintInvoice {
  return {
    tipoDte: '03',
    ambiente: '00',
    numeroControl: 'DTE-03-M001P001-000000000000001',
    codigoGeneracion: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
    fecEmi: '2026-05-21',
    horEmi: '14:30:00',
    tipoMoneda: 'USD',
    selloRecibido: 'SAMPLE-SELLO',
    emisorNombre: 'CREDESAL',
    emisorNit: '06141401141057',
    emisorNrc: '123456-7',
    emisorCodActividad: '64190',
    emisorDescActividad: 'Servicios financieros',
    emisorDireccionComplemento: 'Casa Matriz',
    emisorDireccionMunicipio: '01',
    emisorDireccionDepartamento: '14',
    emisorTelefono: '2222-2222',
    emisorCorreo: 'facturacion@credesal.com',
    receptorNombre: 'CONSUMIDOR FINAL',
    receptorDocId: '00000000-0',
    lineaCrediticia: 'Microcrédito Empresarial',
    numeroCredito: 'CRED-SAMPLE-001',
    lines: [
      {
        numItem: 1,
        descripcion: 'Cuota capital',
        cantidad: 1,
        precioUni: 100,
        ventaGravada: 100,
        ventaExenta: 0,
        ventaNoSuj: 0,
        noGravado: 0
      },
      {
        numItem: 2,
        descripcion: 'Interés',
        cantidad: 1,
        precioUni: 25,
        ventaGravada: 0,
        ventaExenta: 25,
        ventaNoSuj: 0,
        noGravado: 0
      }
    ],
    totalGravada: 100,
    totalExenta: 25,
    totalNoSuj: 0,
    subTotal: 125,
    montoTotalOperacion: 125,
    totalPagar: 125,
    totalLetras: 'CIENTO VEINTICINCO DOLARES'
  };
}
