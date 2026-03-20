/** Angular Imports */
import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

export type DisbursementStatus = 'completado' | 'enviado' | 'pendiente';

export interface DisbursementItem {
  id: string;
  clientName: string;
  clientId: string;
  expectedDisbursedOnDate: string;
  approvedNetDisbursalAmount: number;
  status: DisbursementStatus;
}

interface LoanDisbursementDetail {
  netDisbursalAmount?: number | null;
}

interface LoanForDisbursement {
  id: number;
  clientName?: string | null;
  clientId?: number | null;
  principal?: number | null;
  timeline?: {
    expectedDisbursementDate?: string | number[] | null;
  } | null;
  expected_disbursedon_date?: string | number[] | null;
  expectedDisbursedOnDate?: string | number[] | null;
  expectedDisbursementDate?: string | number[] | null;
  status?: {
    waitingForDisbursal?: boolean;
  };
  disbursementDetails?: LoanDisbursementDetail[] | null;
}

/**
 * Disbursements section component.
 * Disbursements list with date navigation, search, and new disbursement action.
 */
@Component({
  selector: 'mifosx-desembolsos',
  templateUrl: './desembolsos.component.html',
  styleUrls: ['./desembolsos.component.scss'],
  imports: [
    FormsModule,
    MatIcon,
    MatIconButton,
    MatFormField,
    MatPrefix,
    MatNativeDateModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class DesembolsosComponent implements OnInit {
  /** Selected date. */
  selectedDate = signal(new Date());

  /** Model for the mat-datepicker input. */
  selectedDateModel: Date = new Date();

  /** Selected date serialized for API requests (YYYY-MM-DD). */
  selectedDateParam = '';

  /** Formatted date for display (e.g. "lunes, 2 de febrero de 2026"). */
  selectedDateFormatted = computed(() => {
    const d = this.selectedDate();
    return d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  /** Search filter. */
  searchFilter = '';

  /** All disbursements loaded from API for selected date and office. */
  disbursements: DisbursementItem[] = [];

  /** Filtered disbursements based on search. */
  filteredDisbursements: DisbursementItem[] = [...this.disbursements];

  /** Increments on each date-driven load so stale HTTP responses are ignored. */
  private disbursementsLoadGeneration = 0;

  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.applySelectedDateAndReload(today, { clearSearch: false });
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
   * Keeps signals/display in sync and reloads; ngModelChange is more reliable than dateChange alone with [(ngModel)].
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
    }
    this.loadDisbursementsForDate(date);
  }

  openDatePicker(): void {
    // TODO: open mat-datepicker popup
  }

  loadDisbursementsForDate(_date: Date): void {
    const generation = ++this.disbursementsLoadGeneration;
    const dateParam = this.toYyyyMmDd(_date);

    const credentials = this.authenticationService.getCredentials();
    const currentOfficeId = credentials?.officeId;

    let params = new HttpParams()
      .set('fromDate', dateParam)
      .set('toDate', dateParam)
      .set('limit', '1000')
      .set('associations', 'multiDisburseDetails');

    if (currentOfficeId != null && currentOfficeId !== 0) {
      params = params.set('current_office_id', String(currentOfficeId));
    }

    this.http.get<{ pageItems?: LoanForDisbursement[] }>('/loans/pending-disbursements', { params }).subscribe({
      next: (response) => {
        if (generation !== this.disbursementsLoadGeneration) {
          return;
        }
        const pageItems = response?.pageItems ?? [];
        this.disbursements = pageItems.map((loan) => this.mapLoanToDisbursementItem(loan));
        this.applyFilter();
      },
      error: (error) => {
        if (generation !== this.disbursementsLoadGeneration) {
          return;
        }
        this.disbursements = [];
        this.filteredDisbursements = [];
        console.error('[Desembolsos] /loans request failed', error);
      }
    });
  }

  private updateSelectedDateParam(date: Date): void {
    this.selectedDateParam = this.toYyyyMmDd(date);
  }

  private toYyyyMmDd(date: Date): string {
    // Convert Date -> "YYYY-MM-DD" for backend filtering.
    // We use UTC components here because the backend range is date-based (no time),
    // and this avoids day shifts caused by Date timezone representation in the picker.
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  applyFilter(): void {
    const q = this.searchFilter.trim().toLowerCase();
    if (!q) {
      this.filteredDisbursements = [...this.disbursements];
      return;
    }
    this.filteredDisbursements = this.disbursements.filter(
      (d) =>
        d.clientName.toLowerCase().includes(q) || d.clientId.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
    );
  }

  onNewDisbursement(): void {
    // TODO: open new disbursement dialog
  }

  onDisbursementClick(_item: DisbursementItem): void {
    // Open the loan account "general" page in a new tab.
    // This feature is used from the pending disbursements list.
    const item = _item;
    if (!item?.clientId || item.clientId === '-' || !item.id) {
      return;
    }

    const url = `/#/clients/${item.clientId}/loans-accounts/${item.id}/general`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private mapLoanToDisbursementItem(loan: LoanForDisbursement): DisbursementItem {
    const details = loan.disbursementDetails ?? [];
    let approvedNetDisbursalAmount = details.reduce((sum, detail) => {
      const amount = Number(detail.netDisbursalAmount ?? 0);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    if (approvedNetDisbursalAmount <= 0) {
      const fallbackPrincipal = Number(loan.principal ?? 0);
      approvedNetDisbursalAmount = Number.isFinite(fallbackPrincipal) ? fallbackPrincipal : 0;
    }

    return {
      id: String(loan.id),
      clientName: loan.clientName || '-',
      clientId: loan.clientId != null ? String(loan.clientId) : '-',
      expectedDisbursedOnDate: this.getExpectedDisbursedOnDateDisplay(loan),
      approvedNetDisbursalAmount,
      status: 'pendiente'
    };
  }

  private getExpectedDisbursedOnDateDisplay(loan: LoanForDisbursement): string {
    const raw =
      loan.timeline?.expectedDisbursementDate ??
      loan.expected_disbursedon_date ??
      loan.expectedDisbursedOnDate ??
      loan.expectedDisbursementDate ??
      null;
    if (!raw) {
      return '-';
    }
    if (Array.isArray(raw) && raw.length >= 3) {
      const year = Number(raw[0]);
      const month = Number(raw[1]);
      const day = Number(raw[2]);
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
      return '-';
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        return '-';
      }
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
      if (m) {
        const year = m[1];
        const month = m[2];
        const day = m[3];
        return `${day}/${month}/${year}`;
      }
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('es-MX');
      }
      return trimmed;
    }
    return '-';
  }
}
