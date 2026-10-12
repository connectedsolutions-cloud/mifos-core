import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import { BalanceSaldosViewModel, buildBalanceSaldosViewModel } from './balance-saldos-report.model';

@Component({
  selector: 'mifosx-balance-saldos-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-saldos-report.component.html',
  styleUrls: ['./balance-saldos-report.component.scss']
})
export class BalanceSaldosReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  viewModel: BalanceSaldosViewModel | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.viewModel = buildBalanceSaldosViewModel(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.viewModel = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el Balance de Saldos.';
    }
  }

  money(value: number): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return formatted;
  }
}
