import { VisualReportResult } from '../visual-report-result';
import { buildEstadoResultadosConsolidadoViewModel } from './estado-resultados-consolidado-report.model';

const columns = [
  'row_sequence',
  'row_type',
  'office_id',
  'office_name',
  'month_start',
  'year_start',
  'report_date',
  'section_name',
  'group_code',
  'group_name',
  'account_code',
  'account_name',
  'monthly_amount',
  'accumulated_amount'
];

function row(
  sequence: number,
  rowType: string,
  sectionName: string,
  groupCode: string | null,
  groupName: string | null,
  accountCode: string | null,
  accountName: string | null,
  monthlyAmount: number,
  accumulatedAmount: number,
  officeId = 1
) {
  return {
    row: [
      sequence,
      rowType,
      officeId,
      'OFICINA PRINCIPAL',
      [
        2026,
        9,
        1
      ],
      [
        2026,
        1,
        1
      ],
      [
        2026,
        9,
        14
      ],
      sectionName,
      groupCode,
      groupName,
      accountCode,
      accountName,
      monthlyAmount,
      accumulatedAmount
    ]
  };
}

function result(): VisualReportResult {
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data: [
      row(1, 'SECTION', 'INGRESOS', null, null, null, null, 12668.81, 181453.61),
      row(2, 'GROUP', 'INGRESOS', '611', 'INGRESOS DE OPERACIONES DE INTERMEDIACION', null, null, 12668.81, 181453.61),
      row(
        3,
        'ACCOUNT',
        'INGRESOS',
        '611',
        'INGRESOS DE OPERACIONES DE INTERMEDIACION',
        '6110',
        'INGRESOS DE OPERACIONES DE INTERMEDIACION',
        12668.81,
        181453.61
      ),
      row(4, 'SECTION', 'GASTOS', null, null, null, null, 3831.9, 138614.32),
      row(5, 'GROUP', 'GASTOS', '711', 'CAPTACIÓN DE RECURSOS', null, null, 1415.95, 24619.1),
      row(6, 'ACCOUNT', 'GASTOS', '711', 'CAPTACIÓN DE RECURSOS', '7110', 'CAPTACIÓN DE RECURSOS', 1415.95, 24619.1),
      row(7, 'GROUP', 'GASTOS', '811', 'GASTOS DE FUNCIONARIOS Y EMPLEADOS', null, null, 0, 88716.13),
      row(
        8,
        'ACCOUNT',
        'GASTOS',
        '811',
        'GASTOS DE FUNCIONARIOS Y EMPLEADOS',
        '8110',
        'GASTOS DE FUNCIONARIOS Y EMPLEADOS',
        0,
        88716.13
      ),
      row(9, 'GROUP', 'GASTOS', '812', 'GASTOS GENERALES', null, null, 2415.95, 25279.09),
      row(10, 'ACCOUNT', 'GASTOS', '812', 'GASTOS GENERALES', '8120', 'GASTOS GENERALES', 2415.95, 25279.09),
      row(11, 'RESULT', 'RESULTADO', null, null, null, 'EXCEDENTE', 8836.91, 42839.29)]
  };
}

describe('buildEstadoResultadosConsolidadoViewModel', () => {
  it('builds the reference hierarchy and reconciles both result columns', () => {
    const viewModel = buildEstadoResultadosConsolidadoViewModel(result(), 'RAYALA');

    expect(viewModel.periodLabel).toBe('PERIODO DEL 1 de ENERO AL 14 de SEPTIEMBRE de 2026');
    expect(viewModel.sections).toHaveLength(2);
    expect(viewModel.sections[0].groups[0].accounts[0].code).toBe('6110');
    expect(viewModel.sections[1].groups).toHaveLength(3);
    expect(viewModel.monthlyResult).toBe(8836.91);
    expect(viewModel.accumulatedResult).toBe(42839.29);
    expect(viewModel.resultLabel).toBe('EXCEDENTE');
    expect(viewModel.generatedBy).toBe('RAYALA');
  });

  it('rejects a result that does not reconcile to income less expenses', () => {
    const invalid = result();
    invalid.data[10] = row(11, 'RESULT', 'RESULTADO', null, null, null, 'EXCEDENTE', 8836.9, 42839.29);

    expect(() => buildEstadoResultadosConsolidadoViewModel(invalid)).toThrow(/does not reconcile/);
  });

  it('rejects mixed office scope', () => {
    const invalid = result();
    invalid.data[2] = row(
      3,
      'ACCOUNT',
      'INGRESOS',
      '611',
      'INGRESOS DE OPERACIONES DE INTERMEDIACION',
      '6110',
      'INGRESOS DE OPERACIONES DE INTERMEDIACION',
      12668.81,
      181453.61,
      2
    );

    expect(() => buildEstadoResultadosConsolidadoViewModel(invalid)).toThrow(/mixed office or date scopes/);
  });

  it('rejects a missing contract column', () => {
    const invalid = result();
    invalid.columnHeaders = invalid.columnHeaders.filter((header) => header.columnName !== 'row_type');

    expect(() => buildEstadoResultadosConsolidadoViewModel(invalid)).toThrow(/row_type/);
  });
});
