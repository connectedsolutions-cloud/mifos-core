import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import {
  buildEstadoResultadosConsolidadoViewModel,
  EstadoResultadosConsolidadoViewModel
} from './estado-resultados-consolidado-report.model';

@Component({
  selector: 'mifosx-estado-resultados-consolidado-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estado-resultados-consolidado-report.component.html',
  styleUrls: ['./estado-resultados-consolidado-report.component.scss']
})
export class EstadoResultadosConsolidadoReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  viewModel: EstadoResultadosConsolidadoViewModel | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.viewModel = buildEstadoResultadosConsolidadoViewModel(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.viewModel = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar el Estado de Resultados Consolidado.';
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
