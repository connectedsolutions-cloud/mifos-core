import { VisualReportResult } from '../visual-report-result';
import { buildComprobanteContablePorSucursalViewModel } from './comprobante-contable-por-sucursal-report.model';

const columns = [
  'row_sequence',
  'row_type',
  'office_id',
  'office_code',
  'office_name',
  'report_date',
  'group_code',
  'group_name',
  'account_code',
  'account_name',
  'debit',
  'credit'
];

function row(sequence: number, type: string, code: string | null, debit: number | null, credit: number | null) {
  return {
    row: [
      sequence,
      type,
      1,
      '1',
      'AGENCIA CENTRAL',
      [
        2026,
        9,
        14
      ],
      type === 'TOTAL' ? null : '111',
      type === 'TOTAL' ? null : 'FONDOS DISPONIBLES',
      code,
      code ? 'CUENTA DE PRUEBA' : type === 'TOTAL' ? 'TOTAL' : null,
      debit,
      credit
    ]
  };
}

function result(totalDebit = 16866.93, totalCredit = 16866.93): VisualReportResult {
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data: [
      row(1, 'GROUP', null, null, null),
      row(2, 'ACCOUNT', '1110010101', 16866.93, 16866.93),
      row(3, 'TOTAL', null, totalDebit, totalCredit)]
  };
}

describe('buildComprobanteContablePorSucursalViewModel', () => {
  it('builds groups, validates totals, and renders the total in words', () => {
    const viewModel = buildComprobanteContablePorSucursalViewModel(result(), 'RAYALA');

    expect(viewModel.officeName).toBe('AGENCIA CENTRAL');
    expect(viewModel.groups).toHaveLength(1);
    expect(viewModel.groups[0].accounts[0].code).toBe('1110010101');
    expect(viewModel.debitTotal).toBe(16866.93);
    expect(viewModel.creditTotal).toBe(16866.93);
    expect(viewModel.totalInWords).toBe('DIECISEIS MIL OCHOCIENTOS SESENTA Y SEIS 93/100 DÓLARES');
    expect(viewModel.generatedBy).toBe('RAYALA');
  });

  it('rejects a declared total that differs from account rows', () => {
    expect(() => buildComprobanteContablePorSucursalViewModel(result(16866.92, 16866.92))).toThrow(/do not match/);
  });

  it('rejects an unbalanced report', () => {
    const unbalanced = result();
    unbalanced.data[1] = row(2, 'ACCOUNT', '1110010101', 16866.93, 16865.93);
    unbalanced.data[2] = row(3, 'TOTAL', null, 16866.93, 16865.93);

    expect(() => buildComprobanteContablePorSucursalViewModel(unbalanced)).toThrow(/unbalanced/);
  });

  it('rejects a missing contract column', () => {
    const incomplete = result();
    incomplete.columnHeaders = incomplete.columnHeaders.filter((header) => header.columnName !== 'row_type');

    expect(() => buildComprobanteContablePorSucursalViewModel(incomplete)).toThrow(/row_type/);
  });
});
