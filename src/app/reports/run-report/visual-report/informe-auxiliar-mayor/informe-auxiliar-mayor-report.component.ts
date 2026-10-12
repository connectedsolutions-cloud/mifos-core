import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import {
  InformeAuxiliarMayorViewModel,
  buildInformeAuxiliarMayorViewModel
} from './informe-auxiliar-mayor-report.model';

export const INFORME_AUXILIAR_MAYOR_PRINT_PAGE = 'letter landscape';

@Component({
  selector: 'mifosx-informe-auxiliar-mayor-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe-auxiliar-mayor-report.component.html',
  styleUrls: ['./informe-auxiliar-mayor-report.component.scss']
})
export class InformeAuxiliarMayorReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  viewModel: InformeAuxiliarMayorViewModel | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.viewModel = buildInformeAuxiliarMayorViewModel(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.viewModel = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el Informe Auxiliar de Mayor.';
    }
  }

  money(value: number): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(value));
    return value < 0 ? `(${formatted})` : formatted;
  }
}
