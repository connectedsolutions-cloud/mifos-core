/** Angular Imports */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { CashierSessionService } from '../cashier-session.service';
import { OrganizationService } from 'app/organization/organization.service';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

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
    FormatNumberPipe,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class OperacionesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

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
    'txnNote'
  ];

  /** Data source for transactions table. */
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private cashierSessionService: CashierSessionService,
    private organizationService: OrganizationService
  ) {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const s = filter.toLowerCase();
      const txnType = data.txnType?.value?.toLowerCase() ?? '';
      const txnDate = data.txnDate?.toString() ?? '';
      const txnNote = data.txnNote?.toLowerCase() ?? '';
      return txnType.includes(s) || txnDate.includes(s) || txnNote.includes(s);
    };
  }

  ngOnInit(): void {
    this.cashierSessionService
      .getActiveSession()
      .pipe(
        takeUntil(this.destroy$),
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
            return of(null);
          }
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.cashierData = response;
            const items = response.cashierTransactions?.pageItems ?? [];
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
          }
        },
        error: () => {
          this.cashierData = null;
          this.dataSource.data = [];
          this.efectivoEnCaja = null;
          this.operacionesCount = 0;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTransferirBoveda(): void {
    // TODO: wire to transfer-to-vault action
  }

  onCierreCaja(): void {
    // TODO: wire to cash-close action
  }

  onRequerirFondos(): void {
    // TODO: wire to request-vault-funds action
  }

  onOperacionManual(): void {
    // TODO: wire to manual-operation action
  }

  onFiltros(): void {
    // TODO: open filters dialog/panel
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchFilter.trim().toLowerCase();
  }
}
