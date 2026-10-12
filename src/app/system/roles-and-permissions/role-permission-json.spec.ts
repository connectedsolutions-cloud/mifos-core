import {
  RolePermissionJsonError,
  buildRolePermissionUpdateBody,
  parseRolePermissionJson,
  permissionCodesFromRole,
  rolePermissionJsonFileName,
  splitKnownPermissions,
  toRolePermissionJson
} from './role-permission-json';

describe('role-permission-json', () => {
  const role = {
    name: 'Ejecutivo jr.',
    description: 'Handles collections',
    permissionUsageData: [
      { code: 'CREATE_CLIENT', selected: true },
      { code: 'READ_CLIENT', selected: true },
      { code: 'DELETE_CLIENT', selected: false },
      { code: 'CREATE_LOAN', selected: true }
    ]
  };

  it('exports only selected permission codes, sorted', () => {
    expect(toRolePermissionJson(role)).toEqual({
      name: 'Ejecutivo jr.',
      description: 'Handles collections',
      dataScope: 'ALL',
      permissions: [
        'CREATE_CLIENT',
        'CREATE_LOAN',
        'READ_CLIENT'
      ]
    });
  });

  it('parses a permission code array', () => {
    const parsed = parseRolePermissionJson(
      JSON.stringify({
        name: 'Teller',
        description: 'Cash desk',
        dataScope: 'OFFICE',
        permissions: [
          'READ_CLIENT',
          'CREATE_CLIENT'
        ]
      })
    );

    expect(parsed).toEqual({
      name: 'Teller',
      description: 'Cash desk',
      dataScope: 'OFFICE',
      permissions: [
        'CREATE_CLIENT',
        'READ_CLIENT'
      ]
    });
  });

  it('parses an API-style permission map', () => {
    const parsed = parseRolePermissionJson(
      JSON.stringify({
        name: 'Teller',
        permissions: {
          CREATE_CLIENT: true,
          READ_CLIENT: true,
          DELETE_CLIENT: false
        }
      })
    );

    expect(parsed.permissions).toEqual([
      'CREATE_CLIENT',
      'READ_CLIENT'
    ]);
    expect(parsed.description).toBe('');
  });

  it('rejects invalid JSON and missing permissions', () => {
    expect(() => parseRolePermissionJson('{')).toThrow(RolePermissionJsonError);
    expect(() => parseRolePermissionJson(JSON.stringify({ name: 'Teller' }))).toThrow(RolePermissionJsonError);
    expect(() => parseRolePermissionJson(JSON.stringify({ permissions: [''] }))).toThrow(RolePermissionJsonError);
    expect(() => parseRolePermissionJson(JSON.stringify({ permissions: { CREATE_CLIENT: 'yes' } }))).toThrow(
      RolePermissionJsonError
    );
    expect(() => parseRolePermissionJson(JSON.stringify({ permissions: ['READ_CLIENT'], dataScope: 'OWN' }))).toThrow(
      RolePermissionJsonError
    );
  });

  it('splits known and unknown codes against a catalog', () => {
    expect(
      splitKnownPermissions(
        [
          'CREATE_CLIENT',
          'FOO',
          'READ_CLIENT'
        ],
        [
          'READ_CLIENT',
          'CREATE_CLIENT'
        ]
      )
    ).toEqual({
      known: [
        'CREATE_CLIENT',
        'READ_CLIENT'
      ],
      unknown: ['FOO']
    });
  });

  it('builds a true-only payload or a full replace map', () => {
    expect(buildRolePermissionUpdateBody(['CREATE_CLIENT'])).toEqual({
      permissions: { CREATE_CLIENT: true }
    });
    expect(
      buildRolePermissionUpdateBody(
        ['CREATE_CLIENT'],
        [
          'CREATE_CLIENT',
          'READ_CLIENT'
        ]
      )
    ).toEqual({
      permissions: {
        CREATE_CLIENT: true,
        READ_CLIENT: false
      }
    });
  });

  it('extracts catalog codes and a download file name', () => {
    expect(permissionCodesFromRole(role)).toEqual([
      'CREATE_CLIENT',
      'CREATE_LOAN',
      'DELETE_CLIENT',
      'READ_CLIENT'
    ]);
    expect(rolePermissionJsonFileName('Ejecutivo jr.')).toBe('Ejecutivo_jr.json');
  });
});
