import { readFileSync } from 'fs';
import { join } from 'path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualReportResult } from '../visual-report-result';
import { LoanArrearsReportComponent } from './loan-arrears-report.component';
import { buildLoanArrearsDocument } from './loan-arrears-report.model';

const columns = [
  'Orden',
  'Tipo Fila',
  'Tipo Plazo',
  'Sucursal',
  'Línea Crédito',
  'CLSF',
  'Cantidad Préstamos',
  'Cantidad Préstamos en Mora',
  'Monto Desembolsado',
  'Saldo Capital',
  'Cartera Afectada',
  'Capital Vencido',
  'Interés Vencido',
  'Cartera Vigente',
  'Cartera Vencida',
  'Porcentaje Cartera %',
  'Porcentaje Vencido %',
  'Fecha Corte',
  'Período'
];

function sampleResult(): VisualReportResult {
  const base: Record<string, unknown> = {
    'Tipo Plazo': 'CORTO PLAZO',
    Sucursal: 'AGENCIA CENTRAL',
    'Línea Crédito': 'MICROCRÉDITO',
    CLSF: 'A2',
    'Cantidad Préstamos': 2,
    'Cantidad Préstamos en Mora': 2,
    'Monto Desembolsado': 200,
    'Saldo Capital': 150,
    'Cartera Afectada': 150,
    'Capital Vencido': 25,
    'Interés Vencido': 5,
    'Cartera Vigente': 0,
    'Cartera Vencida': 150,
    'Porcentaje Cartera %': 100,
    'Porcentaje Vencido %': 16.6667,
    'Fecha Corte': '2026-09-28',
    Período: '2026-09'
  };
  const row = (sequence: number, type: string, values: Record<string, unknown> = {}) =>
    columns.map((column) => ({ ...base, Orden: sequence, 'Tipo Fila': type, ...values })[column]);
  return {
    columnHeaders: columns.map((columnName) => ({ columnName })),
    data: [
      row(1, 'CLASIFICACION'),
      row(2, 'TOTAL_LINEA', { CLSF: null }),
      row(3, 'TOTAL_SUCURSAL', { CLSF: null, 'Línea Crédito': null }),
      row(4, 'TOTAL_PLAZO', { CLSF: null, 'Línea Crédito': null, Sucursal: null }),
      row(5, 'TOTAL_GENERAL', { CLSF: null, 'Línea Crédito': null, Sucursal: null, 'Tipo Plazo': null })
    ].map((values) => ({ row: values }))
  };
}

describe('Detalle de Saldos de Préstamos y Morosidad preview and print', () => {
  let fixture: ComponentFixture<LoanArrearsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoanArrearsReportComponent] }).compileComponents();
    fixture = TestBed.createComponent(LoanArrearsReportComponent);
    fixture.componentRef.setInput('result', sampleResult());
    fixture.componentRef.setInput('generatedBy', 'RAYALA');
    fixture.detectChanges();
  });

  it('renders the cutoff, grouping, amounts, and grand total', () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('2026-09-28');
    expect(content).toContain('AGENCIA CENTRAL');
    expect(content).toContain('MICROCRÉDITO');
    expect(content).toContain('Total General');
    expect(content).toContain('150.00');
    expect(content).toContain('RAYALA');
  });

  it('shows loans without an active risk tag as unclassified', () => {
    const result = sampleResult();
    const classification = result.data[0].row;
    classification[columns.indexOf('CLSF')] = 'SIN CLASIFICAR';
    classification[columns.indexOf('Cantidad Préstamos en Mora')] = 0;
    classification[columns.indexOf('Cartera Afectada')] = 0;
    const document = buildLoanArrearsDocument(result);
    expect(document.rows[0].classification).toBe('SIN CLASIFICAR');
    expect(document.rows[0].loansInArrears).toBe(0);
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SIN CLASIFICAR');
  });

  it('keeps a landscape print layout with repeated headings', () => {
    const stylesheet = readFileSync(join(__dirname, 'loan-arrears-report.component.scss'), 'utf8');
    expect(stylesheet).toContain('size: letter landscape');
    expect(stylesheet).toContain('table-header-group');
    expect(stylesheet).toContain('break-inside: avoid');
  });

  it('rejects missing grand totals', () => {
    const result = sampleResult();
    result.data.pop();
    expect(() => buildLoanArrearsDocument(result)).toThrow('Falta el total general');
  });
});
