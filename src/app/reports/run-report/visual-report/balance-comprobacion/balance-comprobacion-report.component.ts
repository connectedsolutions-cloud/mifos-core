import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import { buildBalanceComprobacionDocument, TrialBalanceDocument } from './balance-comprobacion-report.model';

@Component({
  selector: 'mifosx-balance-comprobacion-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-comprobacion-report.component.html',
  styleUrls: ['./balance-comprobacion-report.component.scss']
})
export class BalanceComprobacionReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input({ required: true }) cutoff = '';

  document: TrialBalanceDocument | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.document = buildBalanceComprobacionDocument(this.result, this.cutoff);
      this.error = '';
    } catch (error) {
      this.document = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el Balance de Comprobación.';
    }
  }

  money(value: number | null): string {
    if (value === null) return '';
    const amount = `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return value < 0 ? `(${amount})` : amount;
  }
}
