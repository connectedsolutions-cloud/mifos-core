/** Angular Imports */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

/** Custom Services */
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { CashierSessionService } from '../cashier-session.service';
import { OrganizationService } from 'app/organization/organization.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { AlertService } from 'app/core/alert/alert.service';

/** Dialog */
import { AperturarCajaDialogComponent } from '../aperturar-caja-dialog/aperturar-caja-dialog.component';

/** Standalone imports */
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Default cashier view: shows "Aperturar caja" when there is no active cashier session.
 * On click, creates an m_cashier for the current user/office and navigates to operaciones.
 */
@Component({
  selector: 'mifosx-caja-default-view',
  templateUrl: './caja-default-view.component.html',
  styleUrls: ['./caja-default-view.component.scss'],
  imports: [
    MatCard,
    MatCardContent,
    MatButton,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class CajaDefaultViewComponent {
  /** Loading state while creating cashier. */
  loading = false;
  /** Error message to show (no staff, no teller, API error). */
  errorMessage: string | null = null;

  constructor(
    private authenticationService: AuthenticationService,
    private cashierSessionService: CashierSessionService,
    private organizationService: OrganizationService,
    private settingsService: SettingsService,
    private dateUtils: Dates,
    private alertService: AlertService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  /**
   * Opens the till: opens dialog for opening amount, then creates a new cashier with start date, start time and opening balance.
   */
  aperturarCaja(): void {
    this.errorMessage = null;
    const dialogRef = this.dialog.open(AperturarCajaDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((openingAmount: number | undefined) => {
      if (openingAmount === undefined) {
        return;
      }
      const credentials = this.authenticationService.getCredentials();
      if (!credentials) {
        this.alertService.alert({ type: 'Error', message: 'No hay sesión activa.' });
        return;
      }
      const { staffId } = credentials;
      if (staffId == null || staffId === undefined) {
        this.errorMessage = 'labels.teller.Debe tener un cajero asignado para aperturar caja';
        return;
      }
      this.loading = true;
      this.organizationService.getTellers().subscribe({
        next: (tellers: any[]) => {
          const activeTeller = Array.isArray(tellers) ? tellers.find((t: any) => t.status === 'ACTIVE') : null;
          if (!activeTeller || !activeTeller.id) {
            this.loading = false;
            this.errorMessage = 'labels.teller.No hay caja disponible para su oficina';
            return;
          }
          const tellerId = activeTeller.id;
          const today = new Date();
          const dateFormat = this.settingsService.dateFormat;
          const locale = this.settingsService.language.code;
          const startDateStr = this.dateUtils.formatDate(today, dateFormat);
          const hourStartTime = today.getHours();
          const minStartTime = today.getMinutes();
          const payload = {
            staffId,
            startDate: startDateStr,
            isFullDay: true,
            hourStartTime,
            minStartTime,
            dateFormat,
            locale,
            openingBalance: openingAmount
          };
          this.organizationService.createCashier(String(tellerId), payload).subscribe({
            next: (response: any) => {
              this.loading = false;
              const cashierId = response.resourceId ?? response.resource_id;
              if (cashierId != null) {
                this.cashierSessionService.refreshSession();
                this.router.navigate([
                  '/teller',
                  'operaciones'
                ]);
              } else {
                this.errorMessage = 'labels.teller.Error al crear la sesión de caja';
              }
            },
            error: (err) => {
              this.loading = false;
              const msg = err?.error?.errors?.[0]?.defaultUserMessage || err?.message || 'Error al aperturar caja';
              this.alertService.alert({ type: 'Error', message: msg });
            }
          });
        },
        error: (err) => {
          this.loading = false;
          const msg = err?.error?.errors?.[0]?.defaultUserMessage || err?.message || 'Error al cargar cajas';
          this.alertService.alert({ type: 'Error', message: msg });
        }
      });
    });
  }
}
