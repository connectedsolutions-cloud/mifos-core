import * as ExcelJS from 'exceljs';
import {
  REPORTE_SEGURO_MONETARY_HEADERS,
  REPORTE_SEGURO_TEXT_HEADERS,
  REPORTE_SEGURO_TOTAL_HEADERS,
  ReporteSeguroExportInput,
  buildReporteSeguroMetadataLines,
  normalizeReporteSeguroRows,
  parseReporteSeguroNumeric,
  toReporteSeguroMoment
} from './reporte-seguro-export.util';

export {
  buildReporteSeguroCsv,
  buildReporteSeguroMetadataLines,
  buildReporteSeguroPeriodLine,
  downloadBlob,
  isReporteSeguro,
  resolveReportPeriodDates,
  type ReporteSeguroExportInput
} from './reporte-seguro-export.util';

/** Builds a styled Excel workbook matching the insurer plantilla layout. */
export async function buildReporteSeguroWorkbook(input: ReporteSeguroExportInput): Promise<ArrayBuffer> {
  const columns = input.columns;
  const dataRows = normalizeReporteSeguroRows(columns, input.rows);
  const metadata = buildReporteSeguroMetadataLines(input.startDate, input.endDate);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  metadata.forEach((line, index) => {
    const row = worksheet.addRow([line]);
    row.font = {
      bold: true,
      color: index === 0 ? { argb: 'FFFF0000' } : { argb: 'FF000000' }
    };
    row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.mergeCells(row.number, 1, row.number, Math.max(columns.length, 1));
  });

  worksheet.addRow([]);

  const headerRow = worksheet.addRow(columns);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF92D050' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  const firstDataRowNumber = headerRow.number + 1;
  dataRows.forEach((rowObj) => {
    const values = columns.map((col) => {
      const raw = rowObj[col];
      if (REPORTE_SEGURO_MONETARY_HEADERS.has(col)) {
        return raw === '' || raw == null ? null : parseReporteSeguroNumeric(raw);
      }
      if (col === 'FECHA OTORGADO' || col === 'FECHA NAC') {
        const m = toReporteSeguroMoment(raw);
        return m ? m.toDate() : raw === '' ? null : raw;
      }
      return raw === '' ? null : raw;
    });
    const excelRow = worksheet.addRow(values);
    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = columns[colNumber - 1];
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (header === 'FECHA OTORGADO') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' }
        };
        cell.numFmt = 'dd/mm/yyyy';
      } else if (header === 'FECHA NAC') {
        cell.numFmt = 'dd/mm/yyyy';
      } else if (REPORTE_SEGURO_MONETARY_HEADERS.has(header)) {
        cell.numFmt = '#,##0.00';
      } else if (REPORTE_SEGURO_TEXT_HEADERS.has(header)) {
        cell.numFmt = '@';
      }
    });
  });

  const lastDataRowNumber = dataRows.length > 0 ? firstDataRowNumber + dataRows.length - 1 : headerRow.number;
  const totalsRow = worksheet.addRow(columns.map((): null => null));
  totalsRow.font = { bold: true };
  columns.forEach((col, index) => {
    const cell = totalsRow.getCell(index + 1);
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    if (index === 0) {
      cell.value = 'TOTAL';
    } else if (REPORTE_SEGURO_TOTAL_HEADERS.has(col) && dataRows.length > 0) {
      const colLetter = worksheet.getColumn(index + 1).letter;
      cell.value = { formula: `SUM(${colLetter}${firstDataRowNumber}:${colLetter}${lastDataRowNumber})` };
      cell.numFmt = '#,##0.00';
    }
  });

  columns.forEach((_col, index) => {
    const header = columns[index];
    const width = Math.min(Math.max(header.length + 2, 12), 40);
    worksheet.getColumn(index + 1).width = width;
  });

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
