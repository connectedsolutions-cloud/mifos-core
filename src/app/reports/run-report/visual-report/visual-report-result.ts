export interface VisualReportColumnHeader {
  columnName: string;
}

export interface VisualReportResultRow {
  row: unknown[];
}

export interface VisualReportResult {
  columnHeaders: VisualReportColumnHeader[];
  data: VisualReportResultRow[];
}

export type VisualReportRecord = Record<string, unknown>;

/** Converts Fineract's positional GenericResultsetData rows into named records. */
export function resultsetToRecords(result: VisualReportResult): VisualReportRecord[] {
  const columns = (result?.columnHeaders ?? []).map((header) => header.columnName);
  if (new Set(columns).size !== columns.length) {
    throw new Error('Visual report contains duplicate column names.');
  }

  return (result?.data ?? []).map((entry, rowIndex) => {
    if (!Array.isArray(entry.row) || entry.row.length !== columns.length) {
      throw new Error(`Visual report row ${rowIndex + 1} does not match its column contract.`);
    }
    return Object.fromEntries(
      columns.map((column, index) => [
        column,
        entry.row[index]
      ])
    );
  });
}
