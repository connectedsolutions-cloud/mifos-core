import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualReportResult } from '../visual-report-result';
import { BalanceSaldosReportComponent } from './balance-saldos-report.component';

const report: VisualReportResult = {
  columnHeaders: [
    'display_order',
    'as_of_date',
    'account_code',
    'parent_code',
    'account_level',
    'account_description',
    'ending_balance'
  ].map((columnName) => ({ columnName })),
  data: [
    { row: [
        1,
        [
          2026,
          9,
          14
        ],
        '1',
        null,
        0,
        'ACTIVOS',
        '10.00'
      ] },
    { row: [
        2,
        [
          2026,
          9,
          14
        ],
        '11',
        '1',
        1,
        'EFECTIVO',
        '10.00'
      ] }]
};

describe('BalanceSaldosReportComponent', () => {
  let fixture: ComponentFixture<BalanceSaldosReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BalanceSaldosReportComponent] }).compileComponents();
    fixture = TestBed.createComponent(BalanceSaldosReportComponent);
    fixture.componentRef.setInput('result', report);
    fixture.componentRef.setInput('generatedBy', 'RAYALA');
    fixture.detectChanges();
  });

  it('shows negative balances with a minus sign', () => {
    expect(fixture.componentInstance.money(-5865.9)).toBe('-$5,865.90');
    expect(fixture.componentInstance.money(5865.9)).toBe('$5,865.90');
  });

  it('uses one document for preview and print with repeated headings', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.balance-saldos-document')).not.toBeNull();
    expect(element.querySelector('thead')?.textContent).toContain('BALANCE DE SALDOS');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.querySelector('footer')?.textContent).toContain('RAYALA');
    expect(element.querySelector('footer')?.textContent).toContain('d_rpt_balance_saldos');
  });
});
