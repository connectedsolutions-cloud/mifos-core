import { VisualReportResult } from '../visual-report-result';
import { balanceSaldosCsv, buildBalanceSaldosViewModel } from './balance-saldos-report.model';

const columns = [
  'display_order',
  'as_of_date',
  'account_code',
  'parent_code',
  'account_level',
  'account_description',
  'ending_balance'
];

function result(balance = '100.00'): VisualReportResult {
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data: [
      { row: [
          1,
          [
            2026,
            9,
            14
          ],
          '1',
          null,
          0,
          'ACTIVOS',
          balance
        ] },
      { row: [
          2,
          [
            2026,
            9,
            14
          ],
          '11',
          '1',
          1,
          'EFECTIVO',
          '100.00'
        ] },
      { row: [
          3,
          [
            2026,
            9,
            14
          ],
          '111',
          '11',
          2,
          'CAJA',
          '105.00'
        ] },
      { row: [
          4,
          [
            2026,
            9,
            14
          ],
          '112',
          '11',
          2,
          'CONTRA CUENTA',
          '-5.00'
        ] },
      { row: [
          5,
          [
            2026,
            9,
            14
          ],
          '2',
          null,
          0,
          'PASIVOS',
          '0.00'
        ] },
      { row: [
          6,
          [
            2026,
            9,
            14
          ],
          '21',
          '2',
          1,
          'CUENTA EN CERO',
          '0.00'
        ] }]
  };
}

describe('buildBalanceSaldosViewModel', () => {
  it('preserves hierarchy, negative balances, zero rows, and the cutoff date', () => {
    const document = buildBalanceSaldosViewModel(result(), 'RAYALA');
    expect(document.accounts.map((account) => account.code)).toEqual([
      '1',
      '11',
      '111',
      '112',
      '2',
      '21'
    ]);
    expect(document.accounts.find((account) => account.code === '112')?.balance).toBe(-5);
    expect(document.accounts.find((account) => account.code === '21')?.balance).toBe(0);
    expect(document.reportDate).toBe('14/09/2026');
    expect(document.generatedBy).toBe('RAYALA');
  });

  it('exports the same account codes and balances as the printable view', () => {
    const csv = balanceSaldosCsv(buildBalanceSaldosViewModel(result()));
    expect(csv).toContain('"111","CAJA",105.00');
    expect(csv).toContain('"112","CONTRA CUENTA",-5.00');
    expect(csv).toContain('"21","CUENTA EN CERO",0.00');
  });

  it('rejects a parent that does not match the direct-child sum', () => {
    expect(() => buildBalanceSaldosViewModel(result('99.99'))).toThrow(/does not reconcile/);
  });

  it('rejects a missing source column', () => {
    const incomplete = result();
    incomplete.columnHeaders = incomplete.columnHeaders.slice(0, -1);
    expect(() => buildBalanceSaldosViewModel(incomplete)).toThrow(/ending_balance/);
  });
});
