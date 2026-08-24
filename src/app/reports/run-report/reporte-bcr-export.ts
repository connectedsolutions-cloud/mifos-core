import * as ExcelJS from 'exceljs';
import {
  REPORTE_BCR_COLUMNS,
  REPORTE_BCR_DATE_COLUMNS,
  REPORTE_BCR_MONEY_COLUMNS,
  REPORTE_BCR_PERCENT_COLUMNS,
  REPORTE_BCR_TOTAL_COLUMNS,
  ReporteBcrExportInput,
  normalizeReporteBcrRows,
  parseReporteBcrNumeric,
  toReporteBcrMoment
} from './reporte-bcr-export.util';

export {
  isReporteBcr,
  resolveReporteBcrMetadata,
  type ReporteBcrExportInput,
  type ReporteBcrMetadata
} from './reporte-bcr-export.util';

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' }
};

const COLUMN_WIDTHS = [
  16,
  8,
  34,
  15,
  13,
  13,
  13,
  15,
  14,
  9,
  13,
  14,
  14,
  15,
  13,
  11,
  13,
  16
];

function styleMetadataLabel(cell: ExcelJS.Cell): void {
  cell.font = { bold: true, size: 10 };
  cell.alignment = { vertical: 'middle' };
}

function addMetadataRow(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  label: string,
  value: string,
  labelStart: number,
  labelEnd: number,
  valueStart: number,
  valueEnd: number
): void {
  worksheet.mergeCells(rowNumber, labelStart, rowNumber, labelEnd);
  worksheet.mergeCells(rowNumber, valueStart, rowNumber, valueEnd);
  const labelCell = worksheet.getCell(rowNumber, labelStart);
  labelCell.value = label;
  styleMetadataLabel(labelCell);
  const valueCell = worksheet.getCell(rowNumber, valueStart);
  valueCell.value = value;
  valueCell.font = { bold: true, size: 10 };
}

function styleHeaderCell(cell: ExcelJS.Cell): void {
  cell.font = { bold: true, size: 9 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = BORDER;
}

/** Builds the presentation workbook used by Informe BCR Ley Usura. */
export async function buildReporteBcrWorkbook(input: ReporteBcrExportInput): Promise<ArrayBuffer> {
  const sourceRows = normalizeReporteBcrRows(input.columns, input.rows);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = input.metadata.institution;
  workbook.created = input.metadata.issuanceDate;

  const worksheet = workbook.addWorksheet('Sheet1', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    views: [{ state: 'frozen', ySplit: 14 }]
  });
  worksheet.pageSetup.printTitlesRow = '13:14';
  worksheet.headerFooter.oddFooter = '&LInforme BCR Ley Usura&C&P de &N&R' + input.metadata.institution;

  worksheet.mergeCells('A1:R1');
  worksheet.getCell('A1').value = input.metadata.institution;
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:R2');
  worksheet.getCell('A2').value = 'Informe BCR Ley Usura';
  worksheet.getCell('A2').font = { bold: true, size: 13 };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  addMetadataRow(worksheet, 4, 'Moneda:', input.metadata.currency, 1, 3, 4, 7);
  addMetadataRow(worksheet, 4, 'Fecha emisión:', '', 13, 15, 16, 18);
  worksheet.getCell('P4').value = input.metadata.issuanceDate;
  worksheet.getCell('P4').numFmt = 'dd/mm/yyyy hh:mm AM/PM';
  worksheet.getCell('P4').font = { bold: true, size: 10 };
  addMetadataRow(worksheet, 5, 'Periodo:', input.metadata.reportingPeriod, 1, 3, 4, 7);
  addMetadataRow(worksheet, 6, 'Sucursal:', input.metadata.office, 1, 3, 4, 10);
  addMetadataRow(worksheet, 7, 'Segmento:', input.metadata.segment, 1, 3, 4, 10);
  addMetadataRow(worksheet, 8, 'Línea de crédito:', input.metadata.creditLine, 1, 3, 4, 12);

  worksheet.mergeCells('A13:A14');
  worksheet.mergeCells('B13:B14');
  worksheet.mergeCells('C13:C14');
  worksheet.mergeCells('D13:D14');
  worksheet.mergeCells('E13:G13');
  worksheet.mergeCells('H13:H14');
  worksheet.mergeCells('I13:I14');
  worksheet.mergeCells('J13:J14');
  worksheet.mergeCells('K13:K14');
  worksheet.mergeCells('L13:L14');
  worksheet.mergeCells('M13:M14');
  worksheet.mergeCells('N13:O13');
  worksheet.mergeCells('P13:P14');
  worksheet.mergeCells('Q13:Q14');
  worksheet.mergeCells('R13:R14');

  const topHeaders: Record<string, string> = {
    A13: 'No Prestamo',
    B13: 'Clsf',
    C13: 'Nombre',
    D13: 'Monto Aprobado',
    E13: 'Fechas',
    H13: 'Monto Desemb.',
    I13: 'Saldo',
    J13: 'Plazo',
    K13: 'Tasa % Interés',
    L13: 'Cuota K+I',
    M13: 'Cuota Total',
    N13: 'Cargos',
    P13: 'TEA %',
    Q13: 'TEA % Máxima',
    R13: 'Cumplimiento'
  };
  Object.entries(topHeaders).forEach(
    ([
      address,
      value
    ]) => {
      worksheet.getCell(address).value = value;
    }
  );
  worksheet.getCell('E14').value = 'Otorga.';
  worksheet.getCell('F14').value = 'Venci.';
  worksheet.getCell('G14').value = 'Ultimo Pago';
  worksheet.getCell('N14').value = 'Desembolso';
  worksheet.getCell('O14').value = 'Cuota';

  for (let row = 13; row <= 14; row++) {
    for (let column = 1; column <= REPORTE_BCR_COLUMNS.length; column++) {
      styleHeaderCell(worksheet.getCell(row, column));
    }
  }
  worksheet.getRow(13).height = 28;
  worksheet.getRow(14).height = 24;

  const firstDataRow = 15;
  sourceRows.forEach((sourceRow) => {
    const values = REPORTE_BCR_COLUMNS.map((column) => {
      const raw = sourceRow[column];
      if (REPORTE_BCR_DATE_COLUMNS.has(column)) {
        const parsedDate = toReporteBcrMoment(raw);
        return parsedDate ? parsedDate.toDate() : null;
      }
      if (REPORTE_BCR_MONEY_COLUMNS.has(column) || REPORTE_BCR_PERCENT_COLUMNS.has(column) || column === 'Plazo') {
        return parseReporteBcrNumeric(raw);
      }
      return raw === '' ? null : raw;
    });
    const excelRow = worksheet.addRow(values);
    excelRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      const column = REPORTE_BCR_COLUMNS[columnNumber - 1];
      cell.border = BORDER;
      cell.alignment = {
        vertical: 'middle',
        horizontal: column === 'Nombre' ? 'left' : 'center',
        wrapText: column === 'Nombre'
      };
      if (REPORTE_BCR_DATE_COLUMNS.has(column)) {
        cell.numFmt = 'dd/mm/yyyy';
      } else if (REPORTE_BCR_MONEY_COLUMNS.has(column)) {
        cell.numFmt = '$#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (REPORTE_BCR_PERCENT_COLUMNS.has(column)) {
        cell.numFmt = '0.00"%"';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (column === 'No Prestamo') {
        cell.numFmt = '@';
      } else if (column === 'Plazo') {
        cell.numFmt = '0';
      }
    });
  });

  const lastDataRow = sourceRows.length > 0 ? firstDataRow + sourceRows.length - 1 : firstDataRow;
  const totalsRow = worksheet.addRow(REPORTE_BCR_COLUMNS.map((): null => null));
  totalsRow.font = { bold: true };
  totalsRow.getCell(1).value = sourceRows.length;
  totalsRow.getCell(1).numFmt = '0 "registros"';
  totalsRow.getCell(3).value = 'TOTALES';
  REPORTE_BCR_COLUMNS.forEach((column, index) => {
    const cell = totalsRow.getCell(index + 1);
    cell.border = BORDER;
    if (REPORTE_BCR_TOTAL_COLUMNS.has(column) && sourceRows.length > 0) {
      const letter = worksheet.getColumn(index + 1).letter;
      cell.value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` };
      cell.numFmt = '$#,##0.00';
    }
  });

  COLUMN_WIDTHS.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
  worksheet.autoFilter = {
    from: { row: 14, column: 1 },
    to: { row: 14, column: REPORTE_BCR_COLUMNS.length }
  };

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
