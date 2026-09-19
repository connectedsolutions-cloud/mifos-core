import { resultsetToRecords } from './visual-report-result';

describe('resultsetToRecords', () => {
  it('maps positional result rows by column name', () => {
    expect(
      resultsetToRecords({
        columnHeaders: [
          { columnName: 'voucher_number' },
          { columnName: 'debit' }],
        data: [{ row: [
              '2026090214',
              3000
            ] }]
      })
    ).toEqual([{ voucher_number: '2026090214', debit: 3000 }]);
  });

  it('rejects mismatched row widths', () => {
    expect(() =>
      resultsetToRecords({
        columnHeaders: [{ columnName: 'voucher_number' }],
        data: [{ row: [
              '2026090214',
              3000
            ] }]
      })
    ).toThrow(/column contract/);
  });
});
