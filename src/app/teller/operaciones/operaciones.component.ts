/** Angular Imports */
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  MatTable,
  MatTableDataSource,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { CashierSessionService } from '../cashier-session.service';
import { OrganizationService } from 'app/organization/organization.service';
import { PendientesService } from 'app/pendientes/pendientes.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { Subject, takeUntil, switchMap, of, forkJoin } from 'rxjs';
import { tap, filter, map, catchError } from 'rxjs/operators';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { TransferirBovedaDialogComponent } from '../transferir-boveda-dialog/transferir-boveda-dialog.component';
import { RequerirFondosDialogComponent } from '../requerir-fondos-dialog/requerir-fondos-dialog.component';
import {
  CierreCajaDialogComponent,
  CierreCajaDialogData,
  CierreCajaDialogResult
} from '../cierre-caja-dialog/cierre-caja-dialog.component';
import { OperacionManualDialogComponent } from '../operacion-manual-dialog/operacion-manual-dialog.component';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import type { CashierSession } from '../cashier-session.service';
import { InvoiceWidgetComponent } from '../invoice-widget/invoice-widget.component';

/**
 * Operaciones section component.
 * Teller operations: cash in hand, operations count, actions, and operations table.
 * Displays real cashier transactions from the API using organization default currency.
 */
@Component({
  selector: 'mifosx-operaciones',
  templateUrl: './operaciones.component.html',
  styleUrls: ['./operaciones.component.scss'],
  imports: [
    FormsModule,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    MatIcon,
    MatIconButton,
    MatTooltip,
    FormatNumberPipe,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class OperacionesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  /** Incremented on each loadData() so only the latest load applies its result. */
  private loadId = 0;

  /** Cash in hand from API. */
  efectivoEnCaja: number | null = null;
  /** Cash limit from teller's maxTellerCashAmount; fallback when not set. */
  limiteCaja: number | null = null;
  /** Operations count from API. */
  operacionesCount = 0;

  /** Cashier data from API (summary + transactions). */
  cashierData: any = null;
  /** Default currency code (first in organization currencies). */
  defaultCurrencyCode = '';

  /** Search filter for table. */
  searchFilter = '';

  /** Table columns matching organization transactions page. */
  displayedColumns: string[] = [
    'date',
    'transactions',
    'amount',
    'txnNote',
    'invoiceAction'
  ];

  /** Data source for transactions table. */
  dataSource = new MatTableDataSource<any>([]);

  /** Current cashier session (set when session is loaded). */
  currentSession: CashierSession | null = null;

  /** Whether there is already a pending teller-vault-transfer for this session. */
  hasPendingTellerVaultTransfer = false;

  /** Whether there is already a pending requerir-fondos-caja-boveda for this session. */
  hasPendingRequerirFondos = false;

  /** Cached blueprint id for teller-vault-transfer. */
  private tellerVaultTransferBlueprintId: number | null = null;

  /** Cached blueprint id for requerir-fondos-caja-boveda. */
  private requerirFondosBlueprintId: number | null = null;

  constructor(
    private cashierSessionService: CashierSessionService,
    private organizationService: OrganizationService,
    private pendientesService: PendientesService,
    private authenticationService: AuthenticationService,
    private dialog: MatDialog,
    private router: Router,
    private settingsService: SettingsService,
    private dateUtils: Dates,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const s = filter.toLowerCase();
      const txnType = data.txnType?.value?.toLowerCase() ?? '';
      const txnDate = data.txnDate?.toString() ?? '';
      const txnNote = data.txnNote?.toLowerCase() ?? '';
      return txnType.includes(s) || txnDate.includes(s) || txnNote.includes(s);
    };
    this.dataSource.sortingDataAccessor = (data: any, property: string) => {
      if (property === 'date') {
        const v = data.txnDate;
        return v != null ? new Date(v).getTime() : 0;
      }
      const value = data[property];
      if (typeof value === 'object' && value?.value != null) return value.value;
      return value ?? '';
    };
  }

  ngOnInit(): void {
    // Refresh data whenever user navigates to teller/operaciones (e.g. from menu)
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        filter(() => this.router.url.includes('teller/operaciones') || this.router.url.endsWith('/teller'))
      )
      .subscribe(() => this.loadData());

    this.loadData();
  }

  /**
   * Loads cashier session, summary and transactions. Called on init and when navigating to this route.
   * @param skipCacheSession When true, refetch session with cache-bust (use after close till).
   * @param onComplete Optional callback after load finishes (e.g. to run change detection).
   */
  loadData(skipCacheSession?: boolean, onComplete?: () => void): void {
    const myLoadId = ++this.loadId;
    this.cashierSessionService
      .getActiveSession(skipCacheSession ? { skipCache: true } : undefined)
      .pipe(
        takeUntil(this.destroy$),
        tap((session) => {
          if (session?.cashierId != null) {
            this.currentSession = session;
          } else {
            this.currentSession = null;
            this.hasPendingTellerVaultTransfer = false;
            this.hasPendingRequerirFondos = false;
          }
        }),
        switchMap((session) => {
          if (session?.tellerId != null && session?.cashierId != null) {
            this.organizationService.getTeller(String(session.tellerId)).subscribe((teller: any) => {
              const max = teller?.maxTellerCashAmount;
              this.limiteCaja = max != null && max !== '' ? Number(max) : null;
            });
            return this.organizationService.getCurrencies().pipe(
              switchMap((currencies: any) => {
                const options = currencies?.selectedCurrencyOptions ?? [];
                this.defaultCurrencyCode = options[0]?.code ?? '';
                if (this.defaultCurrencyCode) {
                  return this.organizationService.getCashierSummaryAndTransactions(
                    String(session.tellerId),
                    String(session.cashierId),
                    this.defaultCurrencyCode
                  );
                }
                return of(null);
              })
            );
          } else {
            this.limiteCaja = null;
            this.cashierData = null;
            this.dataSource.data = [];
            this.efectivoEnCaja = null;
            this.operacionesCount = 0;
            this.currentSession = null;
            this.hasPendingTellerVaultTransfer = false;
            this.hasPendingRequerirFondos = false;
            return of(null);
          }
        })
      )
      .subscribe({
        next: (response: any) => {
          if (myLoadId !== this.loadId) return;
          if (response) {
            this.cashierData = response;
            const items = (response.cashierTransactions?.pageItems ?? []).slice();
            // Newest first (date descending)
            items.sort((a: any, b: any) => {
              const tA = a.txnDate != null ? new Date(a.txnDate).getTime() : 0;
              const tB = b.txnDate != null ? new Date(b.txnDate).getTime() : 0;
              return tB - tA;
            });
            const openingBalance = items
              .filter((t: any) => t.txnType?.value === 'Open Cashier')
              .reduce((sum: number, t: any) => sum + (Number(t.txnAmount) || 0), 0);
            const sumAlloc = Number(response.sumCashAllocation) || 0;
            const sumIn = Number(response.sumInwardCash) || 0;
            const sumOut = Number(response.sumOutwardCash) || 0;
            const sumSettle = Number(response.sumCashSettlement) || 0;
            const baseNet =
              response.sumCashAllocation != null &&
              response.sumInwardCash != null &&
              response.sumOutwardCash != null &&
              response.sumCashSettlement != null
                ? sumAlloc + sumIn - sumOut - sumSettle
                : (response.netCash ?? 0);
            this.efectivoEnCaja = baseNet + openingBalance;
            this.operacionesCount = items.length;
            this.dataSource.data = items;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.refreshInvoiceStatuses(items);
            this.refreshPendingTellerVaultTransfer();
            this.refreshPendingRequerirFondos();
          }
          onComplete?.();
        },
        error: () => {
          if (myLoadId !== this.loadId) return;
          this.cashierData = null;
          this.dataSource.data = [];
          this.efectivoEnCaja = null;
          this.operacionesCount = 0;
          onComplete?.();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTransferirBoveda(): void {
    if (this.hasPendingTellerVaultTransfer) {
      return;
    }
    const cashierId = this.currentSession?.cashierId;
    const currencyCode = this.defaultCurrencyCode;
    if (cashierId == null || !currencyCode) {
      return;
    }
    const dialogRef = this.dialog.open(TransferirBovedaDialogComponent, {
      width: '500px',
      data: { cashierId, currencyCode }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.refreshPendingTellerVaultTransfer();
      }
    });
  }

  onCierreCaja(): void {
    const tellerId = this.currentSession?.tellerId;
    const cashierId = this.currentSession?.cashierId;
    if (tellerId == null || cashierId == null) {
      return;
    }
    this.organizationService.getCashier(String(tellerId), String(cashierId)).subscribe({
      next: (cashier: any) => {
        if (cashier?.endDate != null && cashier.endDate !== '') {
          this.snackBar.open(this.translate.instant('labels.teller.La sesión de caja ya está cerrada'), undefined, {
            duration: 4000
          });
          return;
        }
        const dateFormat = this.settingsService.dateFormat;
        const locale = this.settingsService.language?.code ?? 'en';
        const dialogData: CierreCajaDialogData = {
          currencyCode: this.defaultCurrencyCode,
          dateFormat,
          locale,
          suggestedAmount: this.efectivoEnCaja ?? undefined
        };
        const dialogRef = this.dialog.open(CierreCajaDialogComponent, {
          width: '500px',
          data: dialogData
        });
        dialogRef.afterClosed().subscribe((result: CierreCajaDialogResult | undefined) => {
          if (result == null) return;
          const endDate = new Date();
          const payload: any = {
            staffId: cashier.staffId,
            description: cashier.description ?? '',
            startDate: this.formatDateForApi(cashier.startDate, dateFormat),
            endDate: this.dateUtils.formatDate(endDate, dateFormat),
            isFullDay: cashier.isFullDay ?? true,
            dateFormat,
            locale,
            closingBalance: result.closingAmount
          };
          if (payload.isFullDay === false && cashier.startTime != null && cashier.endTime != null) {
            const [
              startH,
              startM
            ] = (cashier.startTime + '').split(':');
            const [
              endH,
              endM
            ] = (cashier.endTime + '').split(':');
            payload.hourStartTime = startH ?? '0';
            payload.minStartTime = startM ?? '0';
            payload.hourEndTime = endH ?? '0';
            payload.minEndTime = endM ?? '0';
          }
          if (result.note != null && result.note !== '') {
            payload.closingNote = result.note;
          }
          this.organizationService.updateCashier(String(tellerId), String(cashierId), payload).subscribe({
            next: () => {
              this.cashierSessionService.refreshSession();
              this.loadData(true, () => this.cdr.detectChanges());
              this.snackBar.open(this.translate.instant('labels.teller.Caja cerrada correctamente'), undefined, {
                duration: 3000
              });
            },
            error: (err) => {
              const msg = err?.error?.errors?.[0]?.defaultUserMessage ?? err?.message ?? 'Error closing till';
              this.snackBar.open(msg, undefined, { duration: 5000 });
            }
          });
        });
      },
      error: () => {
        this.snackBar.open(this.translate.instant('labels.teller.No se pudo cargar la sesión de caja'), undefined, {
          duration: 4000
        });
      }
    });
  }

  private formatDateForApi(value: any, dateFormat: string): string {
    if (value == null) return '';
    if (typeof value === 'string' && value.length > 0) {
      const d = this.dateUtils.parseDate(value);
      return this.dateUtils.formatDate(d, dateFormat);
    }
    if (value instanceof Date) {
      return this.dateUtils.formatDate(value, dateFormat);
    }
    if (Array.isArray(value)) {
      const d = this.dateUtils.parseDate(value);
      return this.dateUtils.formatDate(d, dateFormat);
    }
    return '';
  }

  onRequerirFondos(): void {
    if (this.hasPendingRequerirFondos) {
      return;
    }
    const cashierId = this.currentSession?.cashierId;
    const currencyCode = this.defaultCurrencyCode;
    if (cashierId == null || !currencyCode) {
      return;
    }
    const dialogRef = this.dialog.open(RequerirFondosDialogComponent, {
      width: '500px',
      data: { cashierId, currencyCode }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.refreshPendingRequerirFondos();
        this.snackBar.open(this.translate.instant('labels.teller.RequerirFondosCreated'), undefined, {
          duration: 4000
        });
      }
    });
  }

  onOperacionManual(): void {
    const tellerId = this.currentSession?.tellerId;
    const cashierId = this.currentSession?.cashierId;
    const currencyCode = this.defaultCurrencyCode;
    if (tellerId == null || cashierId == null || !currencyCode) {
      this.snackBar.open(this.translate.instant('labels.teller.OperacionManualNoSession'), undefined, {
        duration: 4000
      });
      return;
    }
    const dialogRef = this.dialog.open(OperacionManualDialogComponent, {
      width: '500px',
      data: {
        tellerId,
        cashierId,
        currencyCode,
        efectivoEnCaja: this.efectivoEnCaja
      }
    });
    dialogRef.afterClosed().subscribe((saved: boolean | undefined) => {
      if (saved) {
        this.loadData(undefined, () => this.cdr.detectChanges());
        this.snackBar.open(this.translate.instant('labels.teller.OperacionManualSuccess'), undefined, {
          duration: 3000
        });
      }
    });
  }

  onFiltros(): void {
    // TODO: open filters dialog/panel
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchFilter.trim().toLowerCase();
  }

  isRepaymentInflow(transaction: any): boolean {
    const type = String(transaction?.txnType?.value ?? '').toLowerCase();
    const note = String(transaction?.txnNote ?? '').toLowerCase();
    return type === 'cash in' && note.includes('repayment');
  }

  canShowInvoiceAction(transaction: any): boolean {
    const entityType = transaction?.entityType;
    return this.isRepaymentInflow(transaction) && [
        'loans',
        'savings',
        'client'
      ].includes(entityType);
  }

  isInvoiceVerified(transaction: any): boolean {
    return transaction?._invoiceVerified === true;
  }

  openInvoiceWidget(transaction: any): void {
    if (!this.canShowInvoiceAction(transaction) || transaction?.id == null) {
      return;
    }
    const dialogRef = this.dialog.open(InvoiceWidgetComponent, {
      width: '920px',
      maxHeight: '90vh',
      data: {
        transactionId: Number(transaction.id),
        entityType: transaction.entityType,
        transactionNote: transaction.txnNote,
        currencyCode: this.defaultCurrencyCode,
        loanId:
          transaction.entityType === 'loans' && transaction.entityId != null ? Number(transaction.entityId) : undefined
      }
    });
    dialogRef.afterClosed().subscribe(() => this.loadData());
  }

  private refreshInvoiceStatuses(transactions: any[]): void {
    const eligible = transactions.filter((t) => this.canShowInvoiceAction(t) && t.id != null);
    for (const transaction of transactions) {
      transaction._invoiceVerified = false;
    }
    if (eligible.length === 0) {
      return;
    }

    forkJoin(
      eligible.map((transaction) =>
        this.organizationService.getInvoiceByTransaction(transaction.entityType, Number(transaction.id)).pipe(
          map((invoice) => ({ transaction, invoice })),
          catchError(() => of({ transaction, invoice: null }))
        )
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((results) => {
        for (const { transaction, invoice } of results) {
          transaction._invoiceVerified = this.isInvoiceVerifiedFromData(invoice);
        }
        this.cdr.markForCheck();
      });
  }

  private isInvoiceVerifiedFromData(invoice: any): boolean {
    if (!invoice?.id) {
      return false;
    }
    const status = String(invoice.status ?? '').toUpperCase();
    const mhStatus = String(invoice.mhValidationStatus ?? '').toUpperCase();
    return [
        'GENERATED',
        'SIGNED',
        'SUBMITTED',
        'ACCEPTED'
      ].includes(status) || mhStatus === 'SUCCESS';
  }

  /**
   * Whether the transaction reduces teller cash (money out): Settle Cash, Cash Out.
   */
  isOutflow(transaction: any): boolean {
    const type = transaction?.txnType?.value;
    return type === 'Settle Cash' || type === 'Cash Out';
  }

  /**
   * Returns the amount to display: negative for outflows, positive for inflows; null if no amount.
   */
  getAmountDisplay(transaction: any): number | null {
    const amount = transaction?.txnAmount;
    if (amount == null || amount === '') return null;
    const num = Number(amount);
    if (Number.isNaN(num)) return null;
    return this.isOutflow(transaction) ? -Math.abs(num) : num;
  }

  /**
   * Updates hasPendingTellerVaultTransfer: true if there is an active teller-vault-transfer
   * flow for the current cashier (first step references.cashierId matches current session).
   */
  refreshPendingTellerVaultTransfer(): void {
    const cashierId = this.currentSession?.cashierId;
    if (cashierId == null) {
      this.hasPendingTellerVaultTransfer = false;
      return;
    }
    const currentUserId = this.authenticationService.getCredentials()?.userId;
    if (currentUserId == null) {
      this.hasPendingTellerVaultTransfer = false;
      return;
    }

    const resolveBlueprintThenCheck = (): void => {
      if (this.tellerVaultTransferBlueprintId != null) {
        doCheck(this.tellerVaultTransferBlueprintId);
        return;
      }
      this.pendientesService.getBlueprints().subscribe({
        next: (blueprints: any) => {
          const list = Array.isArray(blueprints) ? blueprints : (blueprints?.pageItems ?? []);
          const blueprint = list.find((b: any) => b.name === 'teller-vault-transfer');
          if (blueprint?.id != null) {
            this.tellerVaultTransferBlueprintId = Number(blueprint.id);
            doCheck(this.tellerVaultTransferBlueprintId);
          } else {
            this.hasPendingTellerVaultTransfer = false;
          }
        },
        error: () => {
          this.hasPendingTellerVaultTransfer = false;
        }
      });
    };

    const doCheck = (blueprintId: number): void => {
      this.pendientesService.getFlows(blueprintId).subscribe({
        next: (flowsResponse: any) => {
          const flows = Array.isArray(flowsResponse)
            ? flowsResponse
            : (flowsResponse?.pageItems ?? flowsResponse ?? []);
          const filtered = flows.filter(
            (f: any) => f.status === 'active' && f.creatorId != null && Number(f.creatorId) === Number(currentUserId)
          );
          if (filtered.length === 0) {
            this.hasPendingTellerVaultTransfer = false;
            return;
          }
          forkJoin(filtered.map((f: any) => this.pendientesService.getFlow(Number(f.id), true))).subscribe({
            next: (flowDetails: any[]) => {
              let found = false;
              for (const detail of flowDetails) {
                const steps = detail?.steps;
                if (Array.isArray(steps) && steps.length > 0) {
                  const firstStep = steps[0];
                  const refs = firstStep?.references;
                  if (refs) {
                    try {
                      const parsed = typeof refs === 'string' ? JSON.parse(refs) : refs;
                      if (parsed != null && Number(parsed.cashierId) === Number(cashierId)) {
                        found = true;
                        break;
                      }
                    } catch {
                      // ignore parse errors
                    }
                  }
                }
              }
              this.hasPendingTellerVaultTransfer = found;
            },
            error: () => {
              this.hasPendingTellerVaultTransfer = false;
            }
          });
        },
        error: () => {
          this.hasPendingTellerVaultTransfer = false;
        }
      });
    };

    resolveBlueprintThenCheck();
  }

  /**
   * Active requerir-fondos-caja-boveda flows created by current user for this cashier session.
   */
  refreshPendingRequerirFondos(): void {
    const cashierId = this.currentSession?.cashierId;
    if (cashierId == null) {
      this.hasPendingRequerirFondos = false;
      return;
    }
    const currentUserId = this.authenticationService.getCredentials()?.userId;
    if (currentUserId == null) {
      this.hasPendingRequerirFondos = false;
      return;
    }

    const resolveBlueprintThenCheck = (): void => {
      if (this.requerirFondosBlueprintId != null) {
        doCheck(this.requerirFondosBlueprintId);
        return;
      }
      this.pendientesService.getBlueprints().subscribe({
        next: (blueprints: any) => {
          const list = Array.isArray(blueprints) ? blueprints : (blueprints?.pageItems ?? []);
          const blueprint = list.find((b: any) => b.name === 'requerir-fondos-caja-boveda');
          if (blueprint?.id != null) {
            this.requerirFondosBlueprintId = Number(blueprint.id);
            doCheck(this.requerirFondosBlueprintId);
          } else {
            this.hasPendingRequerirFondos = false;
          }
        },
        error: () => {
          this.hasPendingRequerirFondos = false;
        }
      });
    };

    const doCheck = (blueprintId: number): void => {
      this.pendientesService.getFlows(blueprintId).subscribe({
        next: (flowsResponse: any) => {
          const flows = Array.isArray(flowsResponse)
            ? flowsResponse
            : (flowsResponse?.pageItems ?? flowsResponse ?? []);
          const filtered = flows.filter(
            (f: any) => f.status === 'active' && f.creatorId != null && Number(f.creatorId) === Number(currentUserId)
          );
          if (filtered.length === 0) {
            this.hasPendingRequerirFondos = false;
            return;
          }
          forkJoin(filtered.map((f: any) => this.pendientesService.getFlow(Number(f.id), true))).subscribe({
            next: (flowDetails: any[]) => {
              let found = false;
              for (const detail of flowDetails) {
                const steps = detail?.steps;
                if (Array.isArray(steps) && steps.length > 0) {
                  const firstStep = steps[0];
                  const refs = firstStep?.references;
                  if (refs) {
                    try {
                      const parsed = typeof refs === 'string' ? JSON.parse(refs) : refs;
                      if (parsed != null && Number(parsed.cashierId) === Number(cashierId)) {
                        found = true;
                        break;
                      }
                    } catch {
                      // ignore parse errors
                    }
                  }
                }
              }
              this.hasPendingRequerirFondos = found;
            },
            error: () => {
              this.hasPendingRequerirFondos = false;
            }
          });
        },
        error: () => {
          this.hasPendingRequerirFondos = false;
        }
      });
    };

    resolveBlueprintThenCheck();
  }
}
