import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import { buildLoanArrearsDocument, LoanArrearsDocument } from './loan-arrears-report.model';

@Component({
  selector: 'mifosx-loan-arrears-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loan-arrears-report.component.html',
  styleUrls: ['./loan-arrears-report.component.scss']
})
export class LoanArrearsReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  document: LoanArrearsDocument | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.document = buildLoanArrearsDocument(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.document = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el detalle de préstamos.';
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  percent(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  }
}
