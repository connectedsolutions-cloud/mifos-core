import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import {
  BalanceSaldosDetalladoViewModel,
  buildBalanceSaldosDetalladoViewModel
} from './balance-saldos-detallado-report.model';

@Component({
  selector: 'mifosx-balance-saldos-detallado-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-saldos-detallado-report.component.html',
  styleUrls: ['./balance-saldos-detallado-report.component.scss']
})
export class BalanceSaldosDetalladoReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  viewModel: BalanceSaldosDetalladoViewModel | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.viewModel = buildBalanceSaldosDetalladoViewModel(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.viewModel = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el Balance de Saldos Detallado.';
    }
  }

  money(value: number | null): string {
    if (value == null) {
      return '';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
