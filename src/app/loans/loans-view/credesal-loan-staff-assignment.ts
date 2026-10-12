export const CREDESAL_LOAN_STAFF_ASSIGNMENT_DATATABLE = 'credesal_loan_staff_assignment';

export interface LoanStaffAssignment {
  promoterStaffId: number | null;
  accountExecutiveStaffId: number | null;
  collectionsManagerStaffId: number | null;
}

export interface LoanStaffAssignmentRole {
  controlName: keyof LoanStaffAssignment;
  column: string;
  labelKey: string;
}

export const EMPTY_LOAN_STAFF_ASSIGNMENT: LoanStaffAssignment = {
  promoterStaffId: null,
  accountExecutiveStaffId: null,
  collectionsManagerStaffId: null
};

export const CREDESAL_LOAN_STAFF_ASSIGNMENT_ROLES: LoanStaffAssignmentRole[] = [
  { controlName: 'promoterStaffId', column: 'promoter_staff_id', labelKey: 'Promotor' },
  {
    controlName: 'accountExecutiveStaffId',
    column: 'account_executive_staff_id',
    labelKey: 'Ejecutivo de cuenta'
  },
  {
    controlName: 'collectionsManagerStaffId',
    column: 'collections_manager_staff_id',
    labelKey: 'Gestor de cobro'
  }
];

function staffId(value: unknown): number | null {
  const parsed = Number(value);
  return value !== null && value !== undefined && value !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseLoanStaffAssignment(response: any): { assignment: LoanStaffAssignment; hasRow: boolean } {
  const headers = response?.columnHeaders || [];
  const row = response?.data?.[0]?.row;
  if (!headers.length || !row) {
    return { assignment: { ...EMPTY_LOAN_STAFF_ASSIGNMENT }, hasRow: false };
  }
  const value = (column: string): unknown => {
    const index = headers.findIndex((header: any) => header.columnName === column);
    return index >= 0 ? row[index] : null;
  };
  return {
    hasRow: true,
    assignment: {
      promoterStaffId: staffId(value('promoter_staff_id')),
      accountExecutiveStaffId: staffId(value('account_executive_staff_id')),
      collectionsManagerStaffId: staffId(value('collections_manager_staff_id'))
    }
  };
}
