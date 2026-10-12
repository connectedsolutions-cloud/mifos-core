import { TestBed } from '@angular/core/testing';
import { MovimientosPartidasReportComponent } from './movimientos-partidas-report.component';
import { VisualReportResult } from '../visual-report-result';

const headers = [
  'Orden',
  'Id Oficina',
  'Sucursal',
  'Partida',
  'Fecha',
  'Concepto Partida',
  'Descripción Partida',
  'Estado',
  'Orden Línea',
  'No. Cuenta',
  'Concepto',
  'Sucursal Línea',
  'Cargos',
  'Abonos',
  'Saldo',
  'Total Cargos',
  'Total Abonos',
  'Saldo Partida',
  'Líneas Partida'
];
const result: VisualReportResult = {
  columnHeaders: headers.map((columnName) => ({ columnName })),
  data: [
    { row: [
        1,
        1,
        'AGENCIA CENTRAL',
        '2026090016',
        '2026-09-02',
        'CREDITO',
        '',
        'CERRADA',
        1,
        '1141030101',
        'PRÉSTAMOS',
        'AGENCIA CENTRAL',
        500,
        0,
        500,
        500,
        500,
        0,
        2
      ] },
    { row: [
        2,
        1,
        'AGENCIA CENTRAL',
        '2026090016',
        '2026-09-02',
        'CREDITO',
        '',
        'CERRADA',
        2,
        '222099940102',
        'EFECTIVO',
        'AGENCIA CENTRAL',
        0,
        500,
        0,
        500,
        500,
        0,
        2
      ] }]
};

describe('Movimientos de Partidas preview and print', () => {
  it('renders partida headers, account lines, totals, and page footer', async () => {
    await TestBed.configureTestingModule({ imports: [MovimientosPartidasReportComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MovimientosPartidasReportComponent);
    fixture.componentInstance.result = result;
    fixture.componentInstance.generatedBy = 'auditor';
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Movimientos de Partidas');
    expect(text).toContain('Partida: 2026090016');
    expect(text).toContain('1141030101');
    expect(text).toContain('$500.00');
    expect(text).toContain('auditor');
    expect(fixture.nativeElement.querySelectorAll('article.partida-page')).toHaveLength(1);
  });
  it('repeats partida context on continuation pages and prints totals once', async () => {
    await TestBed.configureTestingModule({ imports: [MovimientosPartidasReportComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MovimientosPartidasReportComponent);
    const data: VisualReportResult = {
      columnHeaders: headers.map((columnName) => ({ columnName })),
      data: Array.from({ length: 50 }, (_, index) => {
        const debit = index < 25 ? 1 : 0;
        const credit = index < 25 ? 0 : 1;
        const balance = index < 25 ? index + 1 : 49 - index;
        return {
          row: [
            index + 1,
            1,
            'AGENCIA CENTRAL',
            '2026090016',
            '2026-09-02',
            'CREDITO',
            '',
            'CERRADA',
            index + 1,
            '1141030101',
            'PRÉSTAMOS',
            'AGENCIA CENTRAL',
            debit,
            credit,
            balance,
            25,
            25,
            0,
            50
          ]
        };
      })
    };
    fixture.componentInstance.result = data;
    fixture.componentInstance.selectedFrom = '2026-09-01';
    fixture.componentInstance.selectedTo = '2026-09-04';
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    const pages = fixture.nativeElement.querySelectorAll('article.partida-page');
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[1].textContent).toContain('Partida: 2026090016');
    expect(pages[1].textContent).toContain('(continuación)');
    expect(fixture.nativeElement.textContent).toContain('Del 01/09/2026 al 04/09/2026');
    expect(fixture.nativeElement.querySelectorAll('.partida-total')).toHaveLength(1);
  });
});
