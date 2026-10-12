import { VisualReportResult } from '../visual-report-result';
import { buildInformeAuxiliarMayorViewModel } from './informe-auxiliar-mayor-report.model';

const columns = [
  'display_order',
  'row_type',
  'start_date',
  'end_date',
  'account_code',
  'account_name',
  'balance_nature',
  'journal_number',
  'check_number',
  'office_name',
  'journal_date',
  'entry_description',
  'opening_balance',
  'debit',
  'credit',
  'running_balance',
  'account_debit_total',
  'account_credit_total',
  'ending_balance',
  'movement_order'
];

function result(): VisualReportResult {
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data: [
      {
        row: [
          1,
          'ACCOUNT',
          [
            2026,
            9,
            1
          ],
          [
            2026,
            9,
            14
          ],
          '1110010101',
          'CAJA SANTIAGO DE MARIA',
          'D',
          null,
          null,
          null,
          null,
          null,
          0,
          null,
          null,
          0,
          100,
          150,
          -50,
          0
        ]
      },
      {
        row: [
          2,
          'DETAIL',
          [
            2026,
            9,
            1
          ],
          [
            2026,
            9,
            14
          ],
          '1110010101',
          'CAJA SANTIAGO DE MARIA',
          'D',
          '2026090001',
          '389',
          'AGENCIA CENTRAL',
          [
            2026,
            9,
            1
          ],
          'Ingreso',
          0,
          100,
          0,
          100,
          100,
          150,
          -50,
          1
        ]
      },
      {
        row: [
          3,
          'DETAIL',
          [
            2026,
            9,
            1
          ],
          [
            2026,
            9,
            14
          ],
          '1110010101',
          'CAJA SANTIAGO DE MARIA',
          'D',
          '2026090002',
          '',
          'USULUTAN',
          [
            2026,
            9,
            2
          ],
          'Egreso',
          0,
          0,
          150,
          -50,
          100,
          150,
          -50,
          2
        ]
      },
      {
        row: [
          4,
          'TOTAL',
          [
            2026,
            9,
            1
          ],
          [
            2026,
            9,
            14
          ],
          '1110010101',
          'CAJA SANTIAGO DE MARIA',
          'D',
          null,
          null,
          null,
          null,
          'TOTAL CUENTA',
          0,
          100,
          150,
          -50,
          100,
          150,
          -50,
          9223372036854775807
        ]
      }
    ]
  };
}

describe('buildInformeAuxiliarMayorViewModel', () => {
  it('groups ordered movements and validates running and ending balances', () => {
    const viewModel = buildInformeAuxiliarMayorViewModel(result(), 'RAYALA');

    expect(viewModel.generatedBy).toBe('RAYALA');
    expect(viewModel.periodLabel).toBe('Del 01/09/2026 al 14/09/2026');
    expect(viewModel.accounts).toHaveLength(1);
    expect(viewModel.accounts[0].entries).toHaveLength(2);
    expect(viewModel.accounts[0].entries[1].runningBalance).toBe(-50);
    expect(viewModel.accounts[0].endingBalance).toBe(-50);
  });

  it('rejects a missing contract column', () => {
    const incomplete = result();
    incomplete.columnHeaders = incomplete.columnHeaders.filter((header) => header.columnName !== 'check_number');

    expect(() => buildInformeAuxiliarMayorViewModel(incomplete)).toThrow(/check_number/);
  });

  it('rejects a broken running balance', () => {
    const invalid = result();
    invalid.data[2].row[15] = -49;

    expect(() => buildInformeAuxiliarMayorViewModel(invalid)).toThrow(/running balance/);
  });

  it('rejects a missing account total row', () => {
    const invalid = result();
    invalid.data.pop();

    expect(() => buildInformeAuxiliarMayorViewModel(invalid)).toThrow(/one total row/);
  });
});
