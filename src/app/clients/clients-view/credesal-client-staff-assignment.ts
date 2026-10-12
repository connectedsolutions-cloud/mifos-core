export const CREDESAL_CLIENT_STAFF_ASSIGNMENT_DATATABLE = 'credesal_client_staff_assignment';

export type ClientStaffAssignmentRoleId = 'promoter' | 'accountExecutive' | 'collectionsManager';

export interface ClientStaffAssignmentRole {
  id: ClientStaffAssignmentRoleId;
  column: string;
  controlName: keyof ClientStaffAssignment;
  labelKey: string;
  assignAction: string;
  unassignAction: string;
  unassignHeadingKey: string;
  unassignTextKey: string;
}

export interface ClientStaffAssignment {
  promoterStaffId: number | null;
  accountExecutiveStaffId: number | null;
  collectionsManagerStaffId: number | null;
}

export const EMPTY_CLIENT_STAFF_ASSIGNMENT: ClientStaffAssignment = {
  promoterStaffId: null,
  accountExecutiveStaffId: null,
  collectionsManagerStaffId: null
};

export const CREDESAL_CLIENT_STAFF_ASSIGNMENT_ROLES: ClientStaffAssignmentRole[] = [
  {
    id: 'promoter',
    column: 'promoter_staff_id',
    controlName: 'promoterStaffId',
    labelKey: 'Promotor',
    assignAction: 'Assign Promotor',
    unassignAction: 'Unassign Promotor',
    unassignHeadingKey: 'Unassign Promotor',
    unassignTextKey: 'Unassign Promotor client'
  },
  {
    id: 'accountExecutive',
    column: 'account_executive_staff_id',
    controlName: 'accountExecutiveStaffId',
    labelKey: 'Ejecutivo de cuenta',
    assignAction: 'Assign Ejecutivo de cuenta',
    unassignAction: 'Unassign Ejecutivo de cuenta',
    unassignHeadingKey: 'Unassign Ejecutivo de cuenta',
    unassignTextKey: 'Unassign Ejecutivo de cuenta client'
  },
  {
    id: 'collectionsManager',
    column: 'collections_manager_staff_id',
    controlName: 'collectionsManagerStaffId',
    labelKey: 'Gestor de cobro',
    assignAction: 'Assign Gestor de cobro',
    unassignAction: 'Unassign Gestor de cobro',
    unassignHeadingKey: 'Unassign Gestor de cobro',
    unassignTextKey: 'Unassign Gestor de cobro client'
  }
];

export const CREDESAL_CLIENT_HEADER_STAFF_ROLES: ClientStaffAssignmentRole[] = CREDESAL_CLIENT_STAFF_ASSIGNMENT_ROLES;

export function toStaffId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseClientStaffAssignment(datatableResponse: any): {
  assignment: ClientStaffAssignment;
  hasExistingRow: boolean;
} {
  const headers = datatableResponse?.columnHeaders || [];
  const row = datatableResponse?.data?.[0]?.row;
  if (!headers.length || !row) {
    return { assignment: { ...EMPTY_CLIENT_STAFF_ASSIGNMENT }, hasExistingRow: false };
  }

  const valueByColumn = (columnName: string): unknown => {
    const index = headers.findIndex((header: any) => header.columnName === columnName);
    return index < 0 ? null : row[index];
  };

  return {
    hasExistingRow: true,
    assignment: {
      promoterStaffId: toStaffId(valueByColumn('promoter_staff_id')),
      accountExecutiveStaffId: toStaffId(valueByColumn('account_executive_staff_id')),
      collectionsManagerStaffId: toStaffId(valueByColumn('collections_manager_staff_id'))
    }
  };
}

export function buildClientStaffAssignmentPayload(
  assignment: ClientStaffAssignment,
  locale: string
): Record<string, unknown> {
  return {
    locale,
    promoter_staff_id: assignment.promoterStaffId ?? '',
    account_executive_staff_id: assignment.accountExecutiveStaffId ?? '',
    collections_manager_staff_id: assignment.collectionsManagerStaffId ?? ''
  };
}

export function assignmentFromFormValue(
  value: Partial<ClientStaffAssignment> | null | undefined
): ClientStaffAssignment {
  return {
    promoterStaffId: toStaffId(value?.promoterStaffId),
    accountExecutiveStaffId: toStaffId(value?.accountExecutiveStaffId),
    collectionsManagerStaffId: toStaffId(value?.collectionsManagerStaffId)
  };
}

export function hasAnyStaffAssignment(assignment: ClientStaffAssignment): boolean {
  return (
    assignment.promoterStaffId != null ||
    assignment.accountExecutiveStaffId != null ||
    assignment.collectionsManagerStaffId != null
  );
}

export function staffAssignmentRoleByAssignAction(actionName: string): ClientStaffAssignmentRole | undefined {
  return CREDESAL_CLIENT_STAFF_ASSIGNMENT_ROLES.find((role) => role.assignAction === actionName);
}

export function staffAssignmentRoleByUnassignAction(actionName: string): ClientStaffAssignmentRole | undefined {
  return CREDESAL_CLIENT_STAFF_ASSIGNMENT_ROLES.find((role) => role.unassignAction === actionName);
}

export function findStaffDisplayName(
  staffOptions: Array<{ id?: number; displayName?: string }> | null | undefined,
  staffId: number | null
): string {
  if (staffId == null || !staffOptions?.length) {
    return '';
  }
  return staffOptions.find((staff) => Number(staff.id) === Number(staffId))?.displayName || '';
}
