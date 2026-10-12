import { AbstractControl, ValidatorFn } from '@angular/forms';

export interface RoleNameOption {
  id?: string | number;
  name?: string;
}

export function uniqueRoleNameValidator(roles: RoleNameOption[], currentRoleId?: string | number | null): ValidatorFn {
  const taken = new Set(
    (roles || [])
      .filter((role) => currentRoleId == null || String(role.id) !== String(currentRoleId))
      .map((role) =>
        String(role.name || '')
          .trim()
          .toLowerCase()
      )
      .filter((name) => !!name)
  );

  return (control: AbstractControl) => {
    const value = String(control.value ?? '')
      .trim()
      .toLowerCase();
    if (!value) {
      return null;
    }
    return taken.has(value) ? { duplicate: true } : null;
  };
}

export function rolesFromResponse(response: unknown): RoleNameOption[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === 'object' && Array.isArray((response as { pageItems?: unknown }).pageItems)) {
    return (response as { pageItems: RoleNameOption[] }).pageItems;
  }
  return [];
}
