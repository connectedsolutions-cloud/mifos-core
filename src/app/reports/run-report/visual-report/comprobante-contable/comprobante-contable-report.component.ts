import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { ComprobanteContableViewModel, buildComprobanteContableViewModel } from './comprobante-contable-report.model';
import { VisualReportResult } from '../visual-report-result';

@Component({
  selector: 'mifosx-comprobante-contable-report',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe
  ],
  templateUrl: './comprobante-contable-report.component.html',
  styleUrls: ['./comprobante-contable-report.component.scss']
})
export class ComprobanteContableReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  viewModel: ComprobanteContableViewModel | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.viewModel = buildComprobanteContableViewModel(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.viewModel = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el Comprobante Contable.';
    }
  }
}
