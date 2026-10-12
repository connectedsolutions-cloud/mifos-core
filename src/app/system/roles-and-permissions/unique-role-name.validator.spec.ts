import { FormControl } from '@angular/forms';
import { rolesFromResponse, uniqueRoleNameValidator } from './unique-role-name.validator';

describe('uniqueRoleNameValidator', () => {
  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Teller' }
  ];

  it('rejects a name already used by another role', () => {
    const control = new FormControl('teller', uniqueRoleNameValidator(roles, 1));
    expect(control.errors).toEqual({ duplicate: true });
  });

  it('allows the current role to keep its name', () => {
    const control = new FormControl('Admin', uniqueRoleNameValidator(roles, 1));
    expect(control.errors).toBeNull();
  });

  it('ignores surrounding whitespace', () => {
    const control = new FormControl('  Teller  ', uniqueRoleNameValidator(roles));
    expect(control.errors).toEqual({ duplicate: true });
  });

  it('unwraps a pageItems response', () => {
    expect(rolesFromResponse({ pageItems: roles })).toEqual(roles);
  });
});
