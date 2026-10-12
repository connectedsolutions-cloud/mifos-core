import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualReportResult } from '../visual-report-result';
import { buildBalanceComprobacionDocument } from './balance-comprobacion-report.model';
import { BalanceComprobacionReportComponent } from './balance-comprobacion-report.component';

const rows: [string, string, number | null][] = [
  [
    'SECCION',
    'ACTIVO',
    null
  ],
  [
    'GRUPO',
    'EFECTIVO',
    100
  ],
  [
    'CUENTA',
    'CAJA',
    120
  ],
  [
    'CUENTA',
    'PROVISIÓN',
    -20
  ],
  [
    'TOTAL_SECCION',
    'TOTAL ACTIVO',
    100
  ],
  [
    'SECCION',
    'RESULTADO DEUDORAS',
    null
  ],
  [
    'GRUPO',
    'GASTOS',
    20
  ],
  [
    'CUENTA',
    'GASTOS',
    20
  ],
  [
    'TOTAL_BALANCE',
    'TOTAL DE ACTIVO Y CUENTAS DEUDORAS',
    120
  ],
  [
    'SECCION',
    'PASIVO',
    null
  ],
  [
    'GRUPO',
    'DEPÓSITOS',
    70
  ],
  [
    'CUENTA',
    'DEPÓSITOS',
    70
  ],
  [
    'TOTAL_SECCION',
    'TOTAL PASIVO',
    70
  ],
  [
    'SECCION',
    'CAPITAL',
    null
  ],
  [
    'GRUPO',
    'CAPITAL SOCIAL',
    30
  ],
  [
    'CUENTA',
    'CAPITAL SOCIAL',
    30
  ],
  [
    'TOTAL_INTERMEDIO',
    'TOTAL PASIVO, PATRIMONIO Y RESERVAS',
    100
  ],
  [
    'SECCION',
    'RESULTADO ACREEDORAS',
    null
  ],
  [
    'GRUPO',
    'INGRESOS',
    20
  ],
  [
    'CUENTA',
    'INGRESOS',
    20
  ],
  [
    'TOTAL_BALANCE',
    'TOTALES',
    120
  ]

];

function report(): VisualReportResult {
  return {
    columnHeaders: [
      'Orden',
      'Tipo Fila',
      'Sección',
      'Grupo',
      'Cuenta',
      'Descripción',
      'Saldo'
    ].map((columnName) => ({ columnName })),
    data: rows.map(
      ([
          type,
          label,
          amount
        ], index) => ({
        row: [
          index + 1,
          type,
          '',
          '',
          '',
          label,
          amount
        ]
      })
    )
  };
}

describe('Balance de Comprobación visual report', () => {
  it('keeps the statement sections on their reference pages and reconciles totals', () => {
    const document = buildBalanceComprobacionDocument(report(), '2026-09-14');
    expect(document.dateLabel).toBe('Al 14 de SEPTIEMBRE de 2026');
    expect(document.pages[0].map((row) => row.label)).toContain('TOTAL DE ACTIVO Y CUENTAS DEUDORAS');
    expect(document.pages[1][0].label).toBe('PASIVO');
    expect(document.pages[1][document.pages[1].length - 1].amount).toBe(120);
  });

  it('rejects a mismatched group instead of printing misleading totals', () => {
    const invalid = report();
    invalid.data[3].row[6] = -21;
    expect(() => buildBalanceComprobacionDocument(invalid, '2026-09-14')).toThrow(/grupo no coincide/);
  });

  describe('preview and print document', () => {
    let fixture: ComponentFixture<BalanceComprobacionReportComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [BalanceComprobacionReportComponent] }).compileComponents();
      fixture = TestBed.createComponent(BalanceComprobacionReportComponent);
      fixture.componentRef.setInput('result', report());
      fixture.componentRef.setInput('cutoff', '2026-09-14');
      fixture.detectChanges();
    });

    it('renders two letter pages with the repeated heading and separate amount columns', () => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelectorAll('.trial-balance-page')).toHaveLength(2);
      expect(element.querySelectorAll('.trial-balance-heading')).toHaveLength(2);
      expect(element.querySelectorAll('.cuenta .detail')).toHaveLength(6);
      expect(element.querySelector('.cuenta .negative')?.textContent).toContain('($20.00)');
      expect(element.querySelectorAll('.total_balance .summary')).toHaveLength(2);
    });
  });
});
