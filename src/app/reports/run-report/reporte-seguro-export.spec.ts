import {
  buildReporteSeguroCsv,
  buildReporteSeguroMetadataLines,
  buildReporteSeguroPeriodLine,
  isReporteSeguro
} from './reporte-seguro-export.util';

describe('reporte-seguro-export', () => {
  it('detects Reporte Seguro by name', () => {
    expect(isReporteSeguro('Reporte Seguro')).toBe(true);
    expect(isReporteSeguro('reporte seguro')).toBe(true);
    expect(isReporteSeguro('InfoRed')).toBe(false);
  });

  it('builds Spanish same-month period line', () => {
    expect(buildReporteSeguroPeriodLine('2025-12-01', '2025-12-31')).toBe(
      'Declaracion correspondiente al periodo: del 01 al 31 de Diciembre 2025'
    );
  });

  it('builds metadata lines with fixed contratante and policy', () => {
    const lines = buildReporteSeguroMetadataLines('2025-12-01', '2025-12-31');
    expect(lines[0]).toContain('CREDESAL S.A. DE C.V. DE R.L.');
    expect(lines[1]).toContain('CD-00157');
    expect(lines[2]).toContain('Diciembre 2025');
  });

  it('builds CSV with metadata, headers, rows and totals', () => {
    const csv = buildReporteSeguroCsv(
      {
        columns: [
          'NO. CREDITO',
          'MONTO OTORGADO',
          'SALDO CAPITAL',
          'INTERESES POR PAGAR',
          'SUMA ASEGURADA'
        ],
        rows: [
          {
            row: [
              '001553M106',
              100,
              80,
              20,
              100
            ]
          }
        ],
        startDate: '2025-12-01',
        endDate: '2025-12-31'
      },
      ','
    );

    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('Contratante:');
    expect(lines[1]).toContain('CD-00157');
    expect(lines[2]).toContain('Diciembre 2025');
    expect(lines[3]).toBe('');
    expect(lines[4]).toContain('NO. CREDITO');
    expect(lines[5]).toContain('001553M106');
    expect(lines[6].startsWith('TOTAL')).toBe(true);
    expect(lines[6]).toContain('100.00');
  });
});
