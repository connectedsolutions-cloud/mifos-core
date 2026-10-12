import { isValidRoleDataScope, normalizeRoleDataScope } from 'app/core/utils/data-scope';

export interface RolePermissionJson {
  name: string;
  description: string;
  permissions: string[];
  dataScope?: string;
}

export interface SplitKnownPermissions {
  known: string[];
  unknown: string[];
}

export class RolePermissionJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RolePermissionJsonError';
  }
}

export function toRolePermissionJson(role: {
  name?: string;
  description?: string;
  dataScope?: string;
  permissionUsageData?: Array<{ code?: string; selected?: boolean }>;
}): RolePermissionJson {
  const permissions = uniqueSorted(
    (role.permissionUsageData || [])
      .filter((permission) => permission.selected)
      .map((permission) => permission.code)
      .filter(isNonEmptyString)
  );

  return {
    name: role.name || '',
    description: role.description || '',
    dataScope: normalizeRoleDataScope(role.dataScope),
    permissions
  };
}

export function parseRolePermissionJson(text: string): RolePermissionJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new RolePermissionJsonError('Invalid JSON');
  }

  if (!isPlainObject(parsed)) {
    throw new RolePermissionJsonError('Role permission JSON must be an object');
  }

  if (parsed['name'] != null && typeof parsed['name'] !== 'string') {
    throw new RolePermissionJsonError('name must be a string');
  }
  if (parsed['description'] != null && typeof parsed['description'] !== 'string') {
    throw new RolePermissionJsonError('description must be a string');
  }
  if (parsed['dataScope'] != null && !isValidRoleDataScope(parsed['dataScope'])) {
    throw new RolePermissionJsonError('dataScope must be ALL, OFFICE, or ASSIGNED');
  }
  if (parsed['permissions'] == null) {
    throw new RolePermissionJsonError('permissions is required');
  }

  return {
    name: typeof parsed['name'] === 'string' ? parsed['name'] : '',
    description: typeof parsed['description'] === 'string' ? parsed['description'] : '',
    dataScope: typeof parsed['dataScope'] === 'string' ? normalizeRoleDataScope(parsed['dataScope']) : undefined,
    permissions: permissionsFromValue(parsed['permissions'])
  };
}

export function permissionCodesFromRole(role: { permissionUsageData?: Array<{ code?: string }> }): string[] {
  return uniqueSorted((role.permissionUsageData || []).map((permission) => permission.code).filter(isNonEmptyString));
}

export function splitKnownPermissions(codes: string[], catalogCodes: Iterable<string>): SplitKnownPermissions {
  const catalog = new Set(Array.from(catalogCodes));
  const known: string[] = [];
  const unknown: string[] = [];

  for (const code of codes) {
    if (catalog.has(code)) {
      known.push(code);
    } else {
      unknown.push(code);
    }
  }

  return { known, unknown };
}

export function buildRolePermissionUpdateBody(
  selectedCodes: string[],
  catalogCodes?: Iterable<string>
): { permissions: Record<string, boolean> } {
  const selected = new Set(selectedCodes);
  const permissions: Record<string, boolean> = {};

  if (catalogCodes) {
    for (const code of catalogCodes) {
      permissions[code] = selected.has(code);
    }
  } else {
    for (const code of selectedCodes) {
      permissions[code] = true;
    }
  }

  return { permissions };
}

export function rolePermissionJsonFileName(name: string): string {
  const safeName =
    (name || 'role')
      .trim()
      .replace(/[^\w]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'role';
  return `${safeName}.json`;
}

export function downloadRolePermissionJson(roleJson: RolePermissionJson): void {
  const fileName = rolePermissionJsonFileName(roleJson.name);
  const link = document.createElement('a');
  link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(roleJson, null, 2)));
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function permissionsFromValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    if (!value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)) {
      throw new RolePermissionJsonError('permissions must be an array of codes or a code-to-boolean map');
    }
    return uniqueSorted(value.map((entry) => entry.trim()));
  }

  if (isPlainObject(value)) {
    const codes: string[] = [];
    for (const [
      code,
      selected
    ] of Object.entries(value)) {
      if (selected === true) {
        if (!code.trim()) {
          throw new RolePermissionJsonError('permissions must be an array of codes or a code-to-boolean map');
        }
        codes.push(code.trim());
      } else if (selected !== false) {
        throw new RolePermissionJsonError('permissions must be an array of codes or a code-to-boolean map');
      }
    }
    return uniqueSorted(codes);
  }

  throw new RolePermissionJsonError('permissions must be an array of codes or a code-to-boolean map');
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
