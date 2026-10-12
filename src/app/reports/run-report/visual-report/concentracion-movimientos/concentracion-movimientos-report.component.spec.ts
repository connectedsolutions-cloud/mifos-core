import { readFileSync } from 'fs';
import { join } from 'path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualReportResult } from '../visual-report-result';
import { ConcentracionMovimientosReportComponent } from './concentracion-movimientos-report.component';

describe('Concentración de Movimientos Diarios preview and print', () => {
  let fixture: ComponentFixture<ConcentracionMovimientosReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConcentracionMovimientosReportComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConcentracionMovimientosReportComponent);
    const result: VisualReportResult = {
      columnHeaders: [
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
      ].map((columnName) => ({ columnName })),
      data: [
        [
          1,
          'CUENTA',
          1,
          '1',
          'AGENCIA CENTRAL',
          '111',
          'FONDOS',
          10,
          10,
          '2026-09-14'
        ],
        [
          2,
          'TOTAL_SUCURSAL',
          1,
          '1',
          'AGENCIA CENTRAL',
          null,
          'Total por Sucursal',
          10,
          10,
          '2026-09-14'
        ],
        [
          3,
          'CUENTA',
          2,
          '2',
          'USULUTAN',
          '611',
          'INGRESOS',
          5,
          5,
          '2026-09-14'
        ],
        [
          4,
          'TOTAL_SUCURSAL',
          2,
          '2',
          'USULUTAN',
          null,
          'Total por Sucursal',
          5,
          5,
          '2026-09-14'
        ],
        [
          5,
          'TOTAL_GENERAL',
          null,
          null,
          null,
          null,
          'Total General',
          15,
          15,
          '2026-09-14'
        ]

      ].map((row) => ({ row }))
    };
    fixture.componentRef.setInput('result', result);
    fixture.componentRef.setInput('generatedBy', 'RAYALA');
    fixture.detectChanges();
  });

  it('renders two distinct pages with the grand total only on the final page', () => {
    const pages = fixture.nativeElement.querySelectorAll('.daily-movement-page') as NodeListOf<HTMLElement>;
    expect(pages.length).toBe(2);
    expect(pages[0].textContent).toContain('Pág 1 de 2');
    expect(pages[1].textContent).toContain('Pág 2 de 2');
    expect(pages[0].textContent).toContain('AGENCIA CENTRAL');
    expect(pages[1].textContent).toContain('USULUTAN');
    expect(pages[0].textContent).not.toContain('Total General');
    expect(pages[1].textContent).toContain('Total General');
    expect(pages[1].textContent).toContain('RAYALA');
  });

  it('keeps the printable page contract in the stylesheet', () => {
    const stylesheet = readFileSync(join(__dirname, 'concentracion-movimientos-report.component.scss'), 'utf8');
    expect(stylesheet).toContain('size: letter portrait');
    expect(stylesheet).toContain('break-after: page');
    expect(stylesheet).toContain('table-header-group');
  });
});
