import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import {
  ComprobanteContablePorSucursalViewModel,
  buildComprobanteContablePorSucursalViewModel
} from './comprobante-contable-por-sucursal-report.model';

@Component({
  selector: 'mifosx-comprobante-contable-por-sucursal-report',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe
  ],
  templateUrl: './comprobante-contable-por-sucursal-report.component.html',
  styleUrls: ['./comprobante-contable-por-sucursal-report.component.scss']
})
export class ComprobanteContablePorSucursalReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  viewModel: ComprobanteContablePorSucursalViewModel | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.viewModel = buildComprobanteContablePorSucursalViewModel(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.viewModel = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el Comprobante Contable por Sucursal.';
    }
  }
}
