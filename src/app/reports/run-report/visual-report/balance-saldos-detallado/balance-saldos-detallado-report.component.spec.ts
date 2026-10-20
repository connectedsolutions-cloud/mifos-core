import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { VisualReportResult } from '../visual-report-result';
import { BalanceSaldosDetalladoReportComponent } from './balance-saldos-detallado-report.component';

const columns = [
  'display_order',
  'row_type',
  'as_of_date',
  'account_code',
  'parent_code',
  'account_level',
  'account_description',
  'balance_nature',
  'opening_balance',
  'debit_movement',
  'credit_movement',
  'ending_balance',
  'detail_opening_balance',
  'detail_debit_total',
  'detail_credit_total',
  'journal_number',
  'journal_date',
  'branch_code',
  'detail_sequence',
  'entry_description',
  'detail_debit',
  'detail_credit'
];

const report: VisualReportResult = {
  columnHeaders: columns.map((columnName) => ({ columnName })),
  data: [
    { row: [
        1,
        'ACCOUNT',
        [
          2026,
          9,
          14
        ],
        '1',
        null,
        0,
        'ACTIVOS',
        'D',
        0,
        10,
        0,
        10,
        null,
        null,
        null,
        null,
        null,
        null,
        0,
        null,
        null,
        null
      ] },
    { row: [
        2,
        'ACCOUNT',
        [
          2026,
          9,
          14
        ],
        '11',
        '1',
        1,
        'CAJA',
        'D',
        0,
        10,
        0,
        10,
        0,
        10,
        0,
        null,
        null,
        null,
        0,
        null,
        null,
        null
      ] },
    { row: [
        3,
        'DETAIL',
        [
          2026,
          9,
          14
        ],
        '11',
        '1',
        1,
        'CAJA',
        'D',
        0,
        10,
        0,
        10,
        0,
        10,
        0,
        '2026090217',
        [
          2026,
          9,
          14
        ],
        '001',
        1,
        'INGRESOS DE CAJA',
        10,
        0
      ] }]
};

describe('BalanceSaldosDetalladoReportComponent', () => {
  let fixture: ComponentFixture<BalanceSaldosDetalladoReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BalanceSaldosDetalladoReportComponent] }).compileComponents();
    fixture = TestBed.createComponent(BalanceSaldosDetalladoReportComponent);
    fixture.componentRef.setInput('result', report);
    fixture.componentRef.setInput('generatedBy', 'RAYALA');
    fixture.detectChanges();
  });

  it('renders the account hierarchy and daily detail in one preview document', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.detailed-balance-document')).not.toBeNull();
    expect(element.querySelector('thead')?.textContent).toContain('Balance de Saldos Detallado');
    expect(element.querySelectorAll('.account-row')).toHaveLength(2);
    expect(element.querySelector('.detail-row')?.textContent).toContain('2026090217');
    expect(element.querySelector('.detail-total-row')?.textContent).toContain('$10.00');
    expect(element.querySelector('.grand-total-row')?.textContent).toContain('$20.00');
    expect(element.querySelector('footer')?.textContent).toContain('RAYALA');
    expect(element.querySelector('footer')?.textContent).toContain('d_rpt_balance_saldos_det');
  });

  it('prints the office name in the Sucursal column when the report supplies it', () => {
    const named: VisualReportResult = {
      columnHeaders: [
        ...report.columnHeaders,
        { columnName: 'branch_name' }],
      data: report.data.map((item) => ({
        row: [
          ...item.row,
          item.row[1] === 'DETAIL' ? 'SANTIAGO DE MARIA' : null
        ]
      }))
    };
    fixture.componentRef.setInput('result', named);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.detail-branch')?.textContent).toContain('SANTIAGO DE MARIA');
  });

  it('uses minus signs for negative values and shares its layout with print', () => {
    expect(fixture.componentInstance.money(-5865.9)).toBe('-$5,865.90');
    expect(fixture.componentInstance.money(5865.9)).toBe('$5,865.90');
    const stylesheet = readFileSync(
      'src/app/reports/run-report/visual-report/balance-saldos-detallado/balance-saldos-detallado-report.component.scss',
      'utf8'
    );
    expect(stylesheet).toContain('@media print');
    expect(stylesheet).toContain('display: table-header-group');
    expect(stylesheet).toContain('size: letter portrait');
  });
});
