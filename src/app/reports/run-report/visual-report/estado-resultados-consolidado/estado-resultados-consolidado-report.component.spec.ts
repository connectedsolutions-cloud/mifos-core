import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualReportResult } from '../visual-report-result';
import { EstadoResultadosConsolidadoReportComponent } from './estado-resultados-consolidado-report.component';

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

const scope = [
  1,
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
  ]
];

const report: VisualReportResult = {
  columnHeaders: columns.map((columnName) => ({ columnName })),
  data: [
    { row: [
        1,
        'SECTION',
        ...scope,
        'INGRESOS',
        null,
        null,
        null,
        null,
        10,
        100
      ] },
    { row: [
        2,
        'GROUP',
        ...scope,
        'INGRESOS',
        '611',
        'INGRESOS',
        null,
        null,
        10,
        100
      ] },
    { row: [
        3,
        'ACCOUNT',
        ...scope,
        'INGRESOS',
        '611',
        'INGRESOS',
        '6110',
        'INGRESOS',
        10,
        100
      ] },
    { row: [
        4,
        'SECTION',
        ...scope,
        'GASTOS',
        null,
        null,
        null,
        null,
        4,
        40
      ] },
    { row: [
        5,
        'GROUP',
        ...scope,
        'GASTOS',
        '711',
        'GASTOS',
        null,
        null,
        4,
        40
      ] },
    { row: [
        6,
        'ACCOUNT',
        ...scope,
        'GASTOS',
        '711',
        'GASTOS',
        '7110',
        'GASTOS',
        4,
        40
      ] },
    { row: [
        7,
        'RESULT',
        ...scope,
        'RESULTADO',
        null,
        null,
        null,
        'EXCEDENTE',
        6,
        60
      ] }]
};

describe('EstadoResultadosConsolidadoReportComponent', () => {
  let fixture: ComponentFixture<EstadoResultadosConsolidadoReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EstadoResultadosConsolidadoReportComponent] }).compileComponents();
    fixture = TestBed.createComponent(EstadoResultadosConsolidadoReportComponent);
    fixture.componentRef.setInput('result', report);
    fixture.componentRef.setInput('generatedBy', 'RAYALA');
    fixture.detectChanges();
  });

  it('renders the shared preview and print document contract', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.income-statement-document')).not.toBeNull();
    expect(element.querySelectorAll('.section-row')).toHaveLength(2);
    expect(element.querySelectorAll('.account-row')).toHaveLength(2);
    expect(element.querySelector('.result-row')?.textContent).toContain('EXCEDENTE');
    expect(element.querySelector('.document-footer')?.textContent).toContain('RAYALA');
    expect(element.textContent).toContain('$60.00');
  });

  it('formats negative values with parentheses for preview and print', () => {
    expect(fixture.componentInstance.money(-12.5)).toBe('($12.50)');
  });
});
