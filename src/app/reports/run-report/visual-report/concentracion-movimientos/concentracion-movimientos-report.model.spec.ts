import { VisualReportResult } from '../visual-report-result';
import { buildDailyMovementDocument } from './concentracion-movimientos-report.model';

const columns = [
  'Orden',
  'Tipo Fila',
  'Id Oficina',
  'Código Sucursal',
  'Sucursal',
  'Cuenta',
  'Concepto',
  'Cargos',
  'Abonos',
  'Fecha'
];

function sample(): VisualReportResult {
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data: [
      [
        1,
        'CUENTA',
        1,
        '1',
        'AGENCIA CENTRAL',
        '111',
        'FONDOS DISPONIBLES',
        8376.74,
        8233.88,
        [
          2026,
          9,
          14
        ]
      ],
      [
        2,
        'CUENTA',
        1,
        '1',
        'AGENCIA CENTRAL',
        '114',
        'PRÉSTAMOS',
        6890.2,
        7033.06,
        [
          2026,
          9,
          14
        ]
      ],
      [
        3,
        'TOTAL_SUCURSAL',
        1,
        '1',
        'AGENCIA CENTRAL',
        null,
        'Total por Sucursal',
        15266.94,
        15266.94,
        [
          2026,
          9,
          14
        ]
      ],
      [
        4,
        'CUENTA',
        2,
        '2',
        'USULUTAN',
        '611',
        'INGRESOS',
        0,
        359.62,
        [
          2026,
          9,
          14
        ]
      ],
      [
        5,
        'CUENTA',
        2,
        '2',
        'USULUTAN',
        '711',
        'CAPTACIÓN',
        5771.17,
        5411.55,
        [
          2026,
          9,
          14
        ]
      ],
      [
        6,
        'TOTAL_SUCURSAL',
        2,
        '2',
        'USULUTAN',
        null,
        'Total por Sucursal',
        5771.17,
        5771.17,
        [
          2026,
          9,
          14
        ]
      ],
      [
        7,
        'TOTAL_GENERAL',
        null,
        null,
        null,
        null,
        'Total General',
        21038.11,
        21038.11,
        [
          2026,
          9,
          14
        ]
      ]

    ].map((row) => ({ row }))
  };
}

describe('Concentración de Movimientos Diarios adapter', () => {
  it('groups branches in source order and keeps zero-sided amounts visible', () => {
    const report = buildDailyMovementDocument(sample(), 'RAYALA');
    expect(report.reportDate).toBe('14/09/2026');
    expect(report.period).toBe('SEPTIEMBRE - 2026');
    expect(report.branches.map((branch) => branch.name)).toEqual([
      'AGENCIA CENTRAL',
      'USULUTAN'
    ]);
    expect(report.branches[1].accounts[0]).toEqual({
      code: '611',
      description: 'INGRESOS',
      debit: 0,
      credit: 359.62
    });
    expect(report.debitTotal).toBe(21038.11);
  });

  it('accepts offsetting February 19 branch differences and a single unbalanced branch', () => {
    const result: VisualReportResult = {
      columnHeaders: columns.map((columnName) => ({ columnName })),
      data: [
        [
          1,
          'CUENTA',
          1,
          '1',
          'AGENCIA CENTRAL',
          '111',
          'FONDOS',
          1160.88,
          1420.77,
          [
            2026,
            2,
            19
          ]
        ],
        [
          2,
          'TOTAL_SUCURSAL',
          1,
          '1',
          'AGENCIA CENTRAL',
          null,
          'Total por Sucursal',
          1160.88,
          1420.77,
          [
            2026,
            2,
            19
          ]
        ],
        [
          3,
          'CUENTA',
          2,
          '2',
          'USULUTAN',
          '111',
          'FONDOS',
          7560.24,
          7300.35,
          [
            2026,
            2,
            19
          ]
        ],
        [
          4,
          'TOTAL_SUCURSAL',
          2,
          '2',
          'USULUTAN',
          null,
          'Total por Sucursal',
          7560.24,
          7300.35,
          [
            2026,
            2,
            19
          ]
        ],
        [
          5,
          'TOTAL_GENERAL',
          null,
          null,
          null,
          null,
          'Total General',
          8721.12,
          8721.12,
          [
            2026,
            2,
            19
          ]
        ]

      ].map((row) => ({ row }))
    };
    const report = buildDailyMovementDocument(result);
    expect(report.period).toBe('FEBRERO - 2026');
    expect(report.branches[0].debitTotal).toBe(1160.88);
    expect(report.branches[0].creditTotal).toBe(1420.77);
    expect(report.branches[1].debitTotal).toBe(7560.24);
    expect(report.creditTotal).toBe(8721.12);

    const centralOnly: VisualReportResult = {
      columnHeaders: result.columnHeaders,
      data: [
        ...result.data.slice(0, 2),
        { row: [
            3,
            'TOTAL_GENERAL',
            null,
            null,
            null,
            null,
            'Total General',
            1160.88,
            1420.77,
            [
              2026,
              2,
              19
            ]
          ] }]
    };
    expect(buildDailyMovementDocument(centralOnly).creditTotal).toBe(1420.77);
  });

  it('accepts deeper account codes and paginates a long branch without repeating its totals', () => {
    const accountRows = Array.from({ length: 55 }, (_, index) => ({ row: [
        index + 1,
        'CUENTA',
        1,
        '1',
        'SANTIAGO DE MARÍA',
        String(1110000000 + index),
        `Cuenta ${index + 1}`,
        1,
        1,
        '2026-10-16'
      ] }));
    const result: VisualReportResult = {
      columnHeaders: columns.map((columnName) => ({ columnName })),
      data: [
        ...accountRows,
        { row: [
            56,
            'TOTAL_SUCURSAL',
            1,
            '1',
            'SANTIAGO DE MARÍA',
            null,
            'Total por Sucursal',
            55,
            55,
            '2026-10-16'
          ] },
        { row: [
            57,
            'TOTAL_GENERAL',
            null,
            null,
            null,
            null,
            'Total General',
            55,
            55,
            '2026-10-16'
          ] }]
    };
    const report = buildDailyMovementDocument(result);
    expect(report.pages.map((page) => page.accounts.length)).toEqual([
      27,
      27,
      1
    ]);
    expect(report.pages.map((page) => page.showBranchTotal)).toEqual([
      false,
      false,
      true
    ]);
    expect(report.pages.map((page) => page.showGrandTotal)).toEqual([
      false,
      false,
      true
    ]);
    expect(report.debitTotal).toBe(55);
  });

  it('rejects a branch subtotal that does not reconcile', () => {
    const result = sample();
    result.data[2].row[7] = 15266.93;
    expect(() => buildDailyMovementDocument(result)).toThrow('no cuadran');
  });

  it('rejects a missing branch subtotal and duplicate grand total', () => {
    const missing = sample();
    missing.data.splice(2, 1);
    expect(() => buildDailyMovementDocument(missing)).toThrow('Falta el total');

    const duplicate = sample();
    duplicate.data.push({ row: [
        8,
        'TOTAL_GENERAL',
        null,
        null,
        null,
        null,
        'Total General',
        21038.11,
        21038.11,
        [
          2026,
          9,
          14
        ]
      ] });
    expect(() => buildDailyMovementDocument(duplicate)).toThrow('duplicado');
  });
});
