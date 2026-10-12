import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import { DailyMovementDocument, buildDailyMovementDocument } from './concentracion-movimientos-report.model';

@Component({
  selector: 'mifosx-concentracion-movimientos-report',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe
  ],
  templateUrl: './concentracion-movimientos-report.component.html',
  styleUrls: ['./concentracion-movimientos-report.component.scss']
})
export class ConcentracionMovimientosReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';

  document: DailyMovementDocument | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.document = buildDailyMovementDocument(this.result, this.generatedBy);
      this.error = '';
    } catch (error) {
      this.document = null;
      this.error =
        error instanceof Error ? error.message : 'No se pudo preparar la Concentración de Movimientos Diarios.';
    }
  }
}
