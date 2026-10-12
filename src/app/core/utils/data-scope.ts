export interface DataScopeOption {
  value: string;
  labelKey: string;
}

export const USER_DATA_SCOPE_INHERIT = '';

export const ROLE_DATA_SCOPE_OPTIONS: DataScopeOption[] = [
  { value: 'ALL', labelKey: 'labels.inputs.All data' },
  { value: 'OFFICE', labelKey: 'labels.inputs.Office data' },
  { value: 'ASSIGNED', labelKey: 'labels.inputs.Assigned data' }
];

export const USER_DATA_SCOPE_OPTIONS: DataScopeOption[] = [
  { value: USER_DATA_SCOPE_INHERIT, labelKey: 'labels.inputs.Inherit from roles' },
  ...ROLE_DATA_SCOPE_OPTIONS
];

export function dataScopeLabelKey(value?: string | null): string {
  const normalized = (value || '').trim().toUpperCase();
  const match = ROLE_DATA_SCOPE_OPTIONS.find((option) => option.value === normalized);
  return match ? match.labelKey : 'labels.inputs.Inherit from roles';
}

export function normalizeRoleDataScope(value?: string | null): string {
  const normalized = (value || '').trim().toUpperCase();
  return ROLE_DATA_SCOPE_OPTIONS.some((option) => option.value === normalized) ? normalized : 'ALL';
}

export function normalizeUserDataScope(value?: string | null): string {
  if (value == null || String(value).trim() === '') {
    return USER_DATA_SCOPE_INHERIT;
  }
  return normalizeRoleDataScope(value);
}

export function isValidRoleDataScope(value: unknown): value is string {
  return (
    typeof value === 'string' && ROLE_DATA_SCOPE_OPTIONS.some((option) => option.value === value.trim().toUpperCase())
  );
}
