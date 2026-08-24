jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import * as ExcelJS from 'exceljs';
import { buildReporteBcrWorkbook } from './reporte-bcr-export';
import {
  REPORTE_BCR_COLUMNS,
  buildReporteBcrPeriod,
  isReporteBcr,
  resolveReporteBcrMetadata
} from './reporte-bcr-export.util';

describe('reporte-bcr-export', () => {
  it('detects Reporte BCR by name', () => {
    expect(isReporteBcr('Reporte BCR')).toBe(true);
    expect(isReporteBcr('reporte bcr')).toBe(true);
    expect(isReporteBcr('Reporte Seguro')).toBe(false);
  });

  it('builds the Spanish report period and selected metadata', () => {
    const parameters = [
      { name: 'endDate', variable: 'endDate' },
      { name: 'OfficeIdSelectOne', variable: 'officeId' },
      { name: 'currencyIdSelectAll', variable: 'currencyId' },
      { name: 'loanProductIdSelectAll', variable: 'loanProductId' },
      { name: 'BcrSluSelectAll', variable: 'slu' }
    ];
    const metadata = resolveReporteBcrMetadata(
      parameters,
      {
        endDate: '2025-12-31',
        OfficeIdSelectOne: { id: 1, name: 'AGENCIA CENTRAL' },
        currencyIdSelectAll: { id: 'USD', name: 'US Dollar' },
        loanProductIdSelectAll: { id: 7, name: 'M-MICROCREDITO MULTIDESTINO' },
        BcrSluSelectAll: { id: '50', name: '50 - MICROCREDITO MULTIDESTINO' }
      },
      new Date('2026-01-13T08:19:00')
    );

    expect(buildReporteBcrPeriod('2025-12-31')).toBe('2025 - DICIEMBRE');
    expect(metadata.currency).toBe('USD');
    expect(metadata.office).toBe('AGENCIA CENTRAL');
    expect(metadata.segment).toBe('50');
    expect(metadata.creditLine).toBe('M-MICROCREDITO MULTIDESTINO');
  });

  it('builds the BCR header, detail formats, and totals row', async () => {
    const row = [
      '000743M108',
      'A1',
      'PERSONA DE PRUEBA',
      1200,
      '2025-12-01',
      '2026-12-01',
      null,
      1158,
      1100,
      12,
      60,
      110.72,
      111.45,
      42,
      0.73,
      76.82,
      97.15,
      'CUMPLE'
    ];
    const buffer = await buildReporteBcrWorkbook({
      columns: [...REPORTE_BCR_COLUMNS],
      rows: [{ row }],
      metadata: {
        institution: 'CREDESAL S.C. DE R.L. DE C.V.',
        currency: 'USD',
        reportingPeriod: '2025 - DICIEMBRE',
        office: 'AGENCIA CENTRAL',
        segment: '50',
        creditLine: 'M-MICROCREDITO MULTIDESTINO',
        issuanceDate: new Date('2026-01-13T08:19:00')
      }
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.getWorksheet('Sheet1');

    expect(worksheet).toBeDefined();
    expect(worksheet!.getCell('A1').value).toBe('CREDESAL S.C. DE R.L. DE C.V.');
    expect(worksheet!.getCell('A2').value).toBe('Informe BCR Ley Usura');
    expect(worksheet!.getCell('F13').master.address).toBe('E13');
    expect(worksheet!.getCell('Q13').value).toBe('TEA % Máxima');
    expect(worksheet!.getCell('A15').value).toBe('000743M108');
    expect(worksheet!.getCell('D15').numFmt).toBe('$#,##0.00');
    expect(worksheet!.getCell('P15').numFmt).toBe('0.00"%"');
    expect(worksheet!.getCell('A16').value).toBe(1);
    expect((worksheet!.getCell('D16').value as ExcelJS.CellFormulaValue).formula).toBe('SUM(D15:D15)');
  });

  it('keeps stored TEA fields and compliance blank when snapshots are null', async () => {
    const row = REPORTE_BCR_COLUMNS.map((): any => null);
    row[0] = '000001M100';
    const buffer = await buildReporteBcrWorkbook({
      columns: [...REPORTE_BCR_COLUMNS],
      rows: [{ row }],
      metadata: {
        institution: 'CREDESAL S.C. DE R.L. DE C.V.',
        currency: 'USD',
        reportingPeriod: '2025 - DICIEMBRE',
        office: 'AGENCIA CENTRAL',
        segment: '50',
        creditLine: 'M-MICROCREDITO MULTIDESTINO',
        issuanceDate: new Date('2026-01-13T08:19:00')
      }
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.getWorksheet('Sheet1')!;

    expect(worksheet.getCell('P15').value).toBeNull();
    expect(worksheet.getCell('Q15').value).toBeNull();
    expect(worksheet.getCell('R15').value).toBeNull();
  });
});
