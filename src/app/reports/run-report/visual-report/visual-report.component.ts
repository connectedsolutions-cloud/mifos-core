import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { ReportsService } from '../../reports.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { ProgressBarService } from 'app/core/progress-bar/progress-bar.service';
import { ComprobanteContableReportComponent } from './comprobante-contable/comprobante-contable-report.component';
import { ComprobanteContablePorSucursalReportComponent } from './comprobante-contable-por-sucursal/comprobante-contable-por-sucursal-report.component';
import { BalanceSaldosDetalladoReportComponent } from './balance-saldos-detallado/balance-saldos-detallado-report.component';
import { VisualReportResult } from './visual-report-result';

export const VISUAL_VOUCHER_RENDERER = 'VisualVoucher';
export const VISUAL_BRANCH_VOUCHER_RENDERER = 'VisualBranchVoucher';
export const VISUAL_DETAILED_BALANCE_RENDERER = 'VisualDetailBalance';

@Component({
  selector: 'mifosx-visual-report',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    TranslateModule,
    ComprobanteContableReportComponent,
    ComprobanteContablePorSucursalReportComponent,
    BalanceSaldosDetalladoReportComponent
  ],
  templateUrl: './visual-report.component.html',
  styleUrls: ['./visual-report.component.scss']
})
export class VisualReportComponent implements OnChanges {
  @Input({ required: true }) dataObject: any;

  result: VisualReportResult | null = null;
  loading = false;
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

  get isSupportedRenderer(): boolean {
    return [
      VISUAL_VOUCHER_RENDERER,
      VISUAL_BRANCH_VOUCHER_RENDERER,
      VISUAL_DETAILED_BALANCE_RENDERER
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
