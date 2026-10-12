import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { VisualReportResult } from '../visual-report-result';
import { PartidaDocument, buildPartidaDocument } from './movimientos-partidas-report.model';

@Component({
  selector: 'mifosx-movimientos-partidas-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movimientos-partidas-report.component.html',
  styleUrls: ['./movimientos-partidas-report.component.scss']
})
export class MovimientosPartidasReportComponent implements OnChanges {
  @Input({ required: true }) result!: VisualReportResult;
  @Input() generatedBy = '';
  @Input() selectedFrom = '';
  @Input() selectedTo = '';

  document: PartidaDocument | null = null;
  error = '';

  ngOnChanges(): void {
    try {
      this.document = buildPartidaDocument(this.result, this.generatedBy, this.selectedFrom, this.selectedTo);
      this.error = '';
    } catch (error) {
      this.document = null;
      this.error = error instanceof Error ? error.message : 'No se pudo preparar Movimientos de Partidas.';
    }
  }

  amount(value: number): string {
    const formatted = `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return value < 0 ? `(${formatted})` : formatted;
  }
}
