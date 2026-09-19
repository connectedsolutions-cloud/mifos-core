import { buildComprobanteContableViewModel } from './comprobante-contable-report.model';
import { VisualReportResult } from '../visual-report-result';

const columns = [
  'batch_key',
  'batch_sequence',
  'voucher_sequence',
  'voucher_number',
  'entry_date',
  'registration_date',
  'office_name',
  'auxiliary_name',
  'status_name',
  'group_code',
  'group_name',
  'line_sequence',
  'gl_code',
  'gl_name',
  'source_branch_code',
  'line_description',
  'debit',
  'credit',
  'voucher_concept'
];

function row(lineSequence: number, debit: number, credit: number, glCode: string): { row: unknown[] } {
  return {
    row: [
      '001-2026-09-14-1',
      1,
      1,
      '2026090214',
      [
        2026,
        9,
        14
      ],
      [
        2026,
        9,
        14
      ],
      'AGENCIA CENTRAL',
      'CREDITOS',
      'CERRADA',
      glCode.slice(0, 3),
      glCode.startsWith('114') ? 'PRÉSTAMOS' : 'CUENTAS POR PAGAR',
      lineSequence,
      glCode,
      glCode.startsWith('114') ? 'OTORGAMIENTOS ORIGINALES' : 'DESEMBOLSO DE CREDITOS',
      '001',
      'Movimiento de prueba',
      debit,
      credit,
      'CREDITO OTORGADO A: CLIENTE DE PRUEBA'
    ]
  };
}

function result(data = [
    row(1, 3000, 0, '1141030101'),
    row(2, 0, 3000, '222099940102')]): VisualReportResult {
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data
  };
}

describe('buildComprobanteContableViewModel', () => {
  it('groups rows and recomputes balanced voucher totals', () => {
    const viewModel = buildComprobanteContableViewModel(result(), 'RAYALA');

    expect(viewModel.generatedBy).toBe('RAYALA');
    expect(viewModel.batches).toHaveLength(1);
    expect(viewModel.batches[0].vouchers).toHaveLength(1);
    expect(viewModel.batches[0].vouchers[0].groups).toHaveLength(2);
    expect(viewModel.batches[0].vouchers[0].debitTotal).toBe(3000);
    expect(viewModel.batches[0].vouchers[0].creditTotal).toBe(3000);
  });

  it('rejects an incomplete report contract', () => {
    const incomplete = result();
    incomplete.columnHeaders = incomplete.columnHeaders.filter((header) => header.columnName !== 'voucher_number');

    expect(() => buildComprobanteContableViewModel(incomplete)).toThrow(/voucher_number/);
  });

  it('rejects an unbalanced voucher', () => {
    expect(() =>
      buildComprobanteContableViewModel(
        result([
          row(1, 3000, 0, '1141030101'),
          row(2, 0, 2999, '222099940102')])
      )
    ).toThrow(/unbalanced/);
  });
});
