import { VisualReportResult } from '../visual-report-result';
import { buildBalanceSaldosDetalladoViewModel } from './balance-saldos-detallado-report.model';

const columns = [
  'display_order',
  'row_type',
  'as_of_date',
  'account_code',
  'parent_code',
  'account_level',
  'account_description',
  'balance_nature',
  'opening_balance',
  'debit_movement',
  'credit_movement',
  'ending_balance',
  'detail_opening_balance',
  'detail_debit_total',
  'detail_credit_total',
  'journal_number',
  'journal_date',
  'branch_code',
  'detail_sequence',
  'entry_description',
  'detail_debit',
  'detail_credit'
];

function accountRow(): { row: unknown[] } {
  return {
    row: [
      1,
      'ACCOUNT',
      [
        2026,
        9,
        14
      ],
      '1110010101',
      '111001',
      4,
      'CAJA SANTIAGO DE MARIA',
      'D',
      0,
      1733.88,
      1733.88,
      0,
      0,
      1733.88,
      1733.88,
      null,
      null,
      null,
      0,
      null,
      null,
      null
    ]
  };
}

function detailRow(displayOrder: number, sequence: number, debit: number, credit: number): { row: unknown[] } {
  return {
    row: [
      displayOrder,
      'DETAIL',
      [
        2026,
        9,
        14
      ],
      '1110010101',
      '111001',
      4,
      'CAJA SANTIAGO DE MARIA',
      'D',
      0,
      1733.88,
      1733.88,
      0,
      0,
      1733.88,
      1733.88,
      `20260902${String(sequence).padStart(2, '0')}`,
      [
        2026,
        9,
        14
      ],
      '001',
      sequence,
      'Movimiento de prueba',
      debit,
      credit
    ]
  };
}

function result(data = [
    accountRow(),
    detailRow(2, 17, 1733.88, 0),
    detailRow(3, 18, 0, 1733.88)]): VisualReportResult {
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data
  };
}

describe('buildBalanceSaldosDetalladoViewModel', () => {
  it('groups details below their account and validates direct subtotals', () => {
    const viewModel = buildBalanceSaldosDetalladoViewModel(result(), 'RAYALA');

    expect(viewModel.generatedBy).toBe('RAYALA');
    expect(viewModel.reportDate).toBe('14/09/2026');
    expect(viewModel.accounts).toHaveLength(1);
    expect(viewModel.accounts[0].entries).toHaveLength(2);
    expect(viewModel.accounts[0].detailDebitTotal).toBe(1733.88);
    expect(viewModel.accounts[0].detailCreditTotal).toBe(1733.88);
  });

  it('uses the native office name and falls back to the branch code for older results', () => {
    const named = result();
    named.columnHeaders.push({ columnName: 'branch_name' });
    named.data = named.data.map((item) => ({
      row: [
        ...item.row,
        item.row[1] === 'DETAIL' ? 'SANTIAGO DE MARIA' : null
      ]
    }));

    expect(buildBalanceSaldosDetalladoViewModel(named).accounts[0].entries[0].branchName).toBe('SANTIAGO DE MARIA');
    expect(buildBalanceSaldosDetalladoViewModel(result()).accounts[0].entries[0].branchName).toBe('001');
  });

  it('accepts a partida with debit and credit movement on the same account', () => {
    const viewModel = buildBalanceSaldosDetalladoViewModel(
      result([
        accountRow(),
        detailRow(2, 1, 1733.88, 1733.88)])
    );

    expect(viewModel.accounts[0].entries).toHaveLength(1);
    expect(viewModel.accounts[0].entries[0].debit).toBe(1733.88);
    expect(viewModel.accounts[0].entries[0].credit).toBe(1733.88);
  });

  it('rejects a detail with no movement on either side', () => {
    expect(() =>
      buildBalanceSaldosDetalladoViewModel(
        result([
          accountRow(),
          detailRow(2, 1, 0, 0)])
      )
    ).toThrow(/must contain a debit or credit amount/);
  });

  it('rejects a missing contract column', () => {
    const incomplete = result();
    incomplete.columnHeaders = incomplete.columnHeaders.filter((header) => header.columnName !== 'parent_code');

    expect(() => buildBalanceSaldosDetalladoViewModel(incomplete)).toThrow(/parent_code/);
  });

  it('rejects detail totals that do not match the account summary', () => {
    expect(() =>
      buildBalanceSaldosDetalladoViewModel(
        result([
          accountRow(),
          detailRow(2, 17, 1000, 0)])
      )
    ).toThrow(/detail totals/);
  });
});
