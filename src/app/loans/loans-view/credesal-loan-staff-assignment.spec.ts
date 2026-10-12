import { CREDESAL_LOAN_STAFF_ASSIGNMENT_ROLES, parseLoanStaffAssignment } from './credesal-loan-staff-assignment';

describe('Credesal loan staff assignment', () => {
  it('maps all three unambiguous roles from the datatable response', () => {
    const result = parseLoanStaffAssignment({
      columnHeaders: [
        { columnName: 'promoter_staff_id' },
        { columnName: 'account_executive_staff_id' },
        { columnName: 'collections_manager_staff_id' }],
      data: [{ row: [
            10,
            20,
            30
          ] }]
    });

    expect(result).toEqual({
      hasRow: true,
      assignment: {
        promoterStaffId: 10,
        accountExecutiveStaffId: 20,
        collectionsManagerStaffId: 30
      }
    });
    expect(CREDESAL_LOAN_STAFF_ASSIGNMENT_ROLES.map((role) => role.labelKey)).toEqual([
      'Promotor',
      'Ejecutivo de cuenta',
      'Gestor de cobro'
    ]);
  });

  it('returns an empty current assignment when the row does not exist', () => {
    expect(parseLoanStaffAssignment({ columnHeaders: [], data: [] }).hasRow).toBe(false);
  });
});
