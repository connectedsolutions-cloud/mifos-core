/** Angular Imports */
import { Component, computed, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { StandaloneSharedImportsModule } from 'app/standalone-shared.module';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

export type RepaymentScheduledStatus = 'Completado' | 'Pendiente';

export interface RepaymentScheduledRow {
  /** Loan account id. Used for the loan account URL. */
  id: string;
  clientId: string;
  cliente: string;
  monto: number;
  estado: RepaymentScheduledStatus;
}

interface RepaymentScheduledApiItem {
  id: number | string;
  clientId: number | string;
  clientName?: string | null;
  amountToBeRepaid?: number | string | null;
  status?: string | null;
}

/**
 * Pagos section component.
 * Payments list with date filter, search, and register payment action.
 */
@Component({
  selector: 'mifosx-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss'],
  imports: [
    FormsModule,
    MatTableModule,
    MatNativeDateModule,
    MatIcon,
    MatIconButton,
    MatFormField,
    StandaloneSharedImportsModule
  ]
})
export class PagosComponent implements OnInit {
  /** Selected date. */
  selectedDate = signal(new Date());

  /** Model for the mat-datepicker input. */
  selectedDateModel: Date = new Date();

  /** Selected date serialized for API requests (YYYY-MM-DD). */
  selectedDateParam = '';

  /** Formatted date for display. */
  selectedDateFormatted = computed(() => {
    const d = this.selectedDate();
    return d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  /** Search filter for table. */
  searchFilter = '';

  /** Table columns. */
  displayedColumns: string[] = [
    'cliente',
    'monto',
    'estado'
  ];

  /** Payments table data source. */
  paymentsDataSource = new MatTableDataSource<RepaymentScheduledRow>([]);

  /** Increments on each date-driven load so stale HTTP responses are ignored. */
  private repaymentLoadGeneration = 0;

  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {
    this.paymentsDataSource.filterPredicate = (data: RepaymentScheduledRow, filter: string) => {
      const s = filter.toLowerCase();
      return (
        data.cliente.toLowerCase().includes(s) ||
        data.id.toLowerCase().includes(s) ||
        data.clientId.toLowerCase().includes(s) ||
        data.estado.toLowerCase().includes(s)
      );
    };
  }

  ngOnInit(): void {
    this.applySelectedDateAndReload(new Date(), { clearSearch: false });
  }

  onPrevDate(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.applySelectedDateAndReload(d, { clearSearch: true });
  }

  onNextDate(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.applySelectedDateAndReload(d, { clearSearch: true });
  }

  /**
   * Fired when the datepicker input model changes (calendar pick or typing).
   * Keeps the display + API requests in sync.
   */
  onSelectedDateModelChange(value: Date | null): void {
    this.applySelectedDateAndReload(value, { clearSearch: true });
  }

  private applySelectedDateAndReload(date: Date | null, opts: { clearSearch: boolean }): void {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
      return;
    }

    this.selectedDateModel = date;
    this.selectedDate.set(date);
    this.updateSelectedDateParam(date);

    if (opts.clearSearch) {
      this.searchFilter = '';
      this.paymentsDataSource.filter = '';
    }

    this.loadRepaymentsForDate(date);
  }

  onRegistrarPago(): void {
    // TODO: open register payment dialog
  }

  applyFilter(): void {
    this.paymentsDataSource.filter = this.searchFilter.trim().toLowerCase();
  }

  onRepaymentClick(row: RepaymentScheduledRow): void {
    if (!row?.clientId || row.clientId === '-' || !row?.id || row.id === '-') {
      return;
    }

    const url = `/#/clients/${row.clientId}/loans-accounts/${row.id}/general`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private loadRepaymentsForDate(_date: Date): void {
    const generation = ++this.repaymentLoadGeneration;
    const dateParam = this.toYyyyMmDd(_date);

    const credentials = this.authenticationService.getCredentials();
    const currentOfficeId = credentials?.officeId;

    let params = new HttpParams().set('fromDate', dateParam).set('toDate', dateParam).set('limit', '1000');

    if (currentOfficeId != null && currentOfficeId !== 0) {
      params = params.set('current_office_id', String(currentOfficeId));
    }

    this.http.get<{ pageItems?: RepaymentScheduledApiItem[] }>('/loans/repayment-scheduled', { params }).subscribe({
      next: (response) => {
        if (generation !== this.repaymentLoadGeneration) {
          return;
        }

        const pageItems = response?.pageItems ?? [];
        this.paymentsDataSource.data = pageItems.map((item) => this.mapApiItemToRow(item));
        this.applyFilter();
      },
      error: (error) => {
        if (generation !== this.repaymentLoadGeneration) {
          return;
        }
        this.paymentsDataSource.data = [];
        this.paymentsDataSource.filter = '';
        console.error('[Pagos] /loans/repayment-scheduled request failed', error);
      }
    });
  }

  private mapApiItemToRow(item: RepaymentScheduledApiItem): RepaymentScheduledRow {
    const rawStatus = String(item.status ?? '');
    const estado: RepaymentScheduledStatus = rawStatus === 'Completado' ? 'Completado' : 'Pendiente';

    return {
      id: String(item.id ?? '-'),
      clientId: String(item.clientId ?? '-'),
      cliente: item.clientName ?? '-',
      monto: this.toNumberOrZero(item.amountToBeRepaid),
      estado
    };
  }

  private toNumberOrZero(value: number | string | null | undefined): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  private updateSelectedDateParam(date: Date): void {
    this.selectedDateParam = this.toYyyyMmDd(date);
  }

  private toYyyyMmDd(date: Date): string {
    // Convert Date -> "YYYY-MM-DD" for backend filtering.
    // We use UTC components here because the backend range is date-based (no time).
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
