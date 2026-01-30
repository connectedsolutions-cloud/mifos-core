/**
 * Report row-link configuration: maps report id to entity type and column names
 * used to build the URL when a row is clicked. Link-only columns are hidden from the table.
 */
export interface ReportRowLinkConfig {
  entityType: 'loan' | 'client' | 'savings';
  clientIdColumn: string;
  entityIdColumn?: string;
}

export const REPORT_ROW_LINK_CONFIGS: Record<number, ReportRowLinkConfig> = {
  5: { entityType: 'loan', clientIdColumn: 'Client Id', entityIdColumn: 'Loan Id' },
  8: { entityType: 'loan', clientIdColumn: 'Client Id', entityIdColumn: 'Loan Id' }
};

/**
 * Returns the column names used only for building the row link (hidden from table and exports).
 */
export function getLinkOnlyColumnNames(config: ReportRowLinkConfig): string[] {
  return [
    config.clientIdColumn,
    config.entityIdColumn
  ].filter(Boolean);
}

/**
 * Builds the entity URL hash from row values.
 * @returns The hash (e.g. '#/clients/6/loans-accounts/9/general') or null if required values are missing.
 */
export function buildEntityUrl(
  config: ReportRowLinkConfig,
  rowValuesByColumnName: Record<string, unknown>
): string | null {
  const clientId = rowValuesByColumnName[config.clientIdColumn];
  if (clientId == null || clientId === '') {
    return null;
  }
  const clientIdStr = String(clientId);

  switch (config.entityType) {
    case 'client':
      return `#/clients/${clientIdStr}`;
    case 'loan': {
      const entityId = rowValuesByColumnName[config.entityIdColumn!];
      if (entityId == null || entityId === '') {
        return null;
      }
      return `#/clients/${clientIdStr}/loans-accounts/${entityId}/general`;
    }
    case 'savings': {
      const entityId = rowValuesByColumnName[config.entityIdColumn!];
      if (entityId == null || entityId === '') {
        return null;
      }
      return `#/clients/${clientIdStr}/savings-accounts/${entityId}`;
    }
    default:
      return null;
  }
}
