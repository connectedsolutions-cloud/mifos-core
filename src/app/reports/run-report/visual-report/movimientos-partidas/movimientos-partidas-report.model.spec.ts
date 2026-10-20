import { VisualReportResult } from '../visual-report-result';
import { buildPartidaDocument } from './movimientos-partidas-report.model';

const columns = [
  'Orden',
  'Id Oficina',
  'Sucursal',
  'Partida',
  'Fecha',
  'Concepto Partida',
  'Descripción Partida',
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

function sample(): VisualReportResult {
  const row = (order: number, line: number, debit: number, credit: number, balance: number) => [
    order,
    1,
    'AGENCIA CENTRAL',
    '2026090016',
    '2026-09-02',
    'CREDITO OTORGADO',
    '',
    'CERRADA',
    line,
    '1141030101',
    'OTORGAMIENTOS ORIGINALES',
    'AGENCIA CENTRAL',
    debit,
    credit,
    balance,
    500,
    500,
    0,
    2
  ];
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data: [
      { row: row(1, 1, 500, 0, 500) },
      { row: row(2, 2, 0, 500, 0) }]
  };
}

describe('Movimientos de Partidas report model', () => {
  it('groups lines under one partida and preserves the balanced running total', () => {
    const document = buildPartidaDocument(sample(), 'auditor');
    expect(document.entries).toHaveLength(1);
    expect(document.entries[0].lines.map((line) => line.balance)).toEqual([
      500,
      0
    ]);
    expect(document.pages[0].segments[0].showTotal).toBe(true);
    expect(document.pages[0].branch).toBe('AGENCIA CENTRAL');
    expect(document.generatedBy).toBe('auditor');
  });

  it('rejects a changed running balance', () => {
    const result = sample();
    result.data[1].row[14] = 1;
    expect(() => buildPartidaDocument(result)).toThrow('saldo progresivo');
  });

  it('rejects an incomplete entry', () => {
    const result = sample();
    result.data.pop();
    expect(() => buildPartidaDocument(result)).toThrow('líneas necesarias');
  });
  it('shows a native posting group flagged as unbalanced', () => {
    const result = sample();
    for (const data of result.data) {
      data.row[7] = 'DESCUADRADA';
      data.row[16] = 400;
      data.row[17] = 100;
    }
    result.data[1].row[13] = 400;
    result.data[1].row[14] = 100;
    const document = buildPartidaDocument(result);
    expect(document.entries[0].status).toBe('DESCUADRADA');
    expect(document.entries[0].lines[1].balance).toBe(100);
  });

  it('shows a zero-value native line flagged as incomplete', () => {
    const result = sample();
    result.data = [result.data[0]];
    const values = result.data[0].row;
    values[7] = 'INCOMPLETA';
    values[12] = 0;
    values[14] = 0;
    values[15] = 0;
    values[16] = 0;
    values[18] = 1;
    expect(buildPartidaDocument(result).entries[0].lineCount).toBe(1);
  });
});
