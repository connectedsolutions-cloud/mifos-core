import { visualReportCsv } from './visual-report-csv';

describe('visualReportCsv', () => {
  it('keeps opening, movement, and total rows in Fineract order', () => {
    const csv = visualReportCsv({
      columnHeaders: [
        { columnName: 'row_type' },
        { columnName: 'journal_date' },
        { columnName: 'entry_description' },
        { columnName: 'opening_balance' },
        { columnName: 'debit' },
        { columnName: 'ending_balance' }],
      data: [
        { row: [
            'ACCOUNT',
            null,
            null,
            125.5,
            null,
            135.5
          ] },
        { row: [
            'DETAIL',
            [
              2026,
              9,
              1
            ],
            'Cheque "A", pagado',
            125.5,
            10,
            135.5
          ] },
        { row: [
            'TOTAL',
            null,
            'TOTAL CUENTA',
            125.5,
            10,
            135.5
          ] }]
    });

    expect(csv).toBe(
      '\uFEFF"row_type","journal_date","entry_description","opening_balance","debit","ending_balance"\r\n' +
        '"ACCOUNT","","","125.5","","135.5"\r\n' +
        '"DETAIL","2026-09-01","Cheque ""A"", pagado","125.5","10","135.5"\r\n' +
        '"TOTAL","","TOTAL CUENTA","125.5","10","135.5"\r\n'
    );
  });

  it('escapes spreadsheet formulas in text without changing negative numbers', () => {
    const csv = visualReportCsv({
      columnHeaders: [
        { columnName: 'description' },
        { columnName: 'balance' }],
      data: [{ row: [
            '=HYPERLINK("bad")',
            -198.03
          ] }]
    });

    expect(csv).toContain('"\'=HYPERLINK(""bad"")","-198.03"');
  });

  it('rejects rows that do not match the report columns', () => {
    expect(() =>
      visualReportCsv({ columnHeaders: [{ columnName: 'row_type' }], data: [{ row: [
              'ACCOUNT',
              1
            ] }] })
    ).toThrow(/fila 1/);
  });
});
