import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { ReportsService } from '../../reports.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { ProgressBarService } from 'app/core/progress-bar/progress-bar.service';
import { ComprobanteContableReportComponent } from './comprobante-contable/comprobante-contable-report.component';
import { ComprobanteContablePorSucursalReportComponent } from './comprobante-contable-por-sucursal/comprobante-contable-por-sucursal-report.component';
import { BalanceSaldosDetalladoReportComponent } from './balance-saldos-detallado/balance-saldos-detallado-report.component';
import { BalanceSaldosReportComponent } from './balance-saldos/balance-saldos-report.component';
import { EstadoResultadosConsolidadoReportComponent } from './estado-resultados-consolidado/estado-resultados-consolidado-report.component';
import { InformeAuxiliarMayorReportComponent } from './informe-auxiliar-mayor/informe-auxiliar-mayor-report.component';
import { BalanceComprobacionReportComponent } from './balance-comprobacion/balance-comprobacion-report.component';
import { ConcentracionMovimientosReportComponent } from './concentracion-movimientos/concentracion-movimientos-report.component';
import { LoanArrearsReportComponent } from './loan-arrears/loan-arrears-report.component';
import { MovimientosPartidasReportComponent } from './movimientos-partidas/movimientos-partidas-report.component';
import { balanceSaldosCsv, buildBalanceSaldosViewModel } from './balance-saldos/balance-saldos-report.model';
import { visualReportCsv } from './visual-report-csv';
import { downloadVisualReportPdf } from './visual-report-pdf';
import { VisualReportResult } from './visual-report-result';

export const VISUAL_VOUCHER_RENDERER = 'VisualVoucher';
export const VISUAL_BRANCH_VOUCHER_RENDERER = 'VisualBranchVoucher';
export const VISUAL_DETAILED_BALANCE_RENDERER = 'VisualDetailBalance';
export const VISUAL_BALANCE_SALDOS_RENDERER = 'VisualBalanceSaldos';
export const VISUAL_INCOME_STATEMENT_RENDERER = 'VisualIncomeStmt';
export const VISUAL_AUXILIARY_LEDGER_RENDERER = 'VisualAuxLedger';
export const VISUAL_TRIAL_BALANCE_RENDERER = 'VisualTrialBalance';
export const VISUAL_DAILY_MOVEMENT_RENDERER = 'VisualDailyMovement';
export const VISUAL_LOAN_ARREARS_RENDERER = 'VisualLoanArrears';
export const VISUAL_PARTIDA_MOVES_RENDERER = 'VisualPartidaMoves';

@Component({
  selector: 'mifosx-visual-report',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    TranslateModule,
    ComprobanteContableReportComponent,
    ComprobanteContablePorSucursalReportComponent,
    BalanceSaldosDetalladoReportComponent,
    BalanceSaldosReportComponent,
    EstadoResultadosConsolidadoReportComponent,
    InformeAuxiliarMayorReportComponent,
    BalanceComprobacionReportComponent,
    ConcentracionMovimientosReportComponent,
    LoanArrearsReportComponent,
    MovimientosPartidasReportComponent
  ],
  templateUrl: './visual-report.component.html',
  styleUrls: ['./visual-report.component.scss']
})
export class VisualReportComponent implements OnChanges {
  @Input({ required: true }) dataObject: any;
  @ViewChild('reportCanvas') reportCanvas?: ElementRef<HTMLElement>;

  result: VisualReportResult | null = null;
  loading = false;
  pdfGenerating = false;
  error = '';

  constructor(
    private reportsService: ReportsService,
    private progressBarService: ProgressBarService,
    private authenticationService: AuthenticationService
  ) {}

  get reportOperator(): string {
    return this.authenticationService.getCredentials()?.username ?? '';
  }

  get rendererKey(): string {
    return this.dataObject?.report?.subType ?? '';
  }

  get trialBalanceCutoff(): string {
    return String(this.dataObject?.formData?.R_endDate ?? '');
  }

  get isSupportedRenderer(): boolean {
    return [
      VISUAL_VOUCHER_RENDERER,
      VISUAL_BRANCH_VOUCHER_RENDERER,
      VISUAL_DETAILED_BALANCE_RENDERER,
      VISUAL_BALANCE_SALDOS_RENDERER,
      VISUAL_INCOME_STATEMENT_RENDERER,
      VISUAL_AUXILIARY_LEDGER_RENDERER,
      VISUAL_TRIAL_BALANCE_RENDERER,
      VISUAL_DAILY_MOVEMENT_RENDERER,
      VISUAL_LOAN_ARREARS_RENDERER,
      VISUAL_PARTIDA_MOVES_RENDERER
    ].includes(this.rendererKey);
  }

  ngOnChanges(): void {
    this.load();
  }

  load(): void {
    this.result = null;
    this.error = '';
    if (!this.isSupportedRenderer) {
      this.error = `No visual renderer is registered for ${this.rendererKey || 'this report'}.`;
      return;
    }

    this.loading = true;
    this.reportsService
      .getRunReportData(this.dataObject.report.name, this.dataObject.formData)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.progressBarService.decrease();
        })
      )
      .subscribe({
        next: (result: VisualReportResult) => {
          if (!result?.data?.length) {
            this.error = 'No report data was generated.';
            return;
          }
          this.result = result;
        },
        error: () => {
          this.error = 'The visual report could not be loaded.';
        }
      });
  }

  downloadCsv(): void {
    if (!this.result) return;
    try {
      const content =
        this.rendererKey === VISUAL_BALANCE_SALDOS_RENDERER
          ? balanceSaldosCsv(buildBalanceSaldosViewModel(this.result, this.reportOperator))
          : visualReportCsv(this.result);
      const file = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${
        String(this.dataObject?.report?.name ?? 'reporte')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'reporte'
      }.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo exportar el CSV.';
    }
  }

  async downloadPdf(): Promise<void> {
    const canvas = this.reportCanvas?.nativeElement;
    if (!this.result || !canvas || this.pdfGenerating) {
      return;
    }
    this.pdfGenerating = true;
    this.error = '';
    try {
      await downloadVisualReportPdf(canvas, this.rendererKey, String(this.dataObject?.report?.name ?? ''));
    } catch {
      this.error = 'No se pudo generar el PDF.';
    } finally {
      this.pdfGenerating = false;
    }
  }

  print(): void {
    document.body.classList.add('visual-report-printing');
    const cleanUp = () => {
      document.body.classList.remove('visual-report-printing');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);
    window.print();
  }
}
