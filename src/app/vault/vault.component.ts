import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule, MatCardContent } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { DateFormatPipe } from '../pipes/date-format.pipe';
import { FormatNumberPipe } from '../pipes/format-number.pipe';
import { STANDALONE_SHARED_IMPORTS } from '../standalone-shared.module';
import { VaultService } from './vault.service';
import { VaultAllocateCashDialogComponent } from './allocate-cash-dialog/allocate-cash-dialog.component';

@Component({
  selector: 'mifosx-vault',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatCardContent,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    TranslateModule,
    FaIconComponent,
    DateFormatPipe,
    FormatNumberPipe,
    ...STANDALONE_SHARED_IMPORTS
  ],
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss']
})
export class VaultComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  loading = true;
  error: string | null = null;
  noOfficeMessage = false;
  noVaultMappingMessage = false;

  officeName = '';
  balance: number | null = null;
  vaultGlAccountId: number | null = null;
  officeId: number | null = null;

  transactionsDataSource = new MatTableDataSource<any>([]);
  transactionsTotalRecords = 0;
  displayedColumns = [
    'transactionDate',
    'transactionId',
    'comments',
    'signedAmount',
    'runningBalance'
  ];

  constructor(
    private vaultService: VaultService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadVaultData();
  }

  loadVaultData(): void {
    this.loading = true;
    this.error = null;
    this.noOfficeMessage = false;
    this.noVaultMappingMessage = false;

    this.vaultService.getVaultDataForCurrentOffice().subscribe({
      next: (data) => {
        this.officeId = data.officeId;
        this.officeName = data.officeName;
        this.vaultGlAccountId = data.vaultGlAccountId;
        this.balance = data.balance;
        this.noOfficeMessage = data.officeId == null;
        this.noVaultMappingMessage = data.officeId != null && !data.hasVaultMapping;
        this.loading = false;
        if (data.officeId != null && data.vaultGlAccountId != null) {
          this.loadTransactions();
        } else {
          this.transactionsDataSource.data = [];
          this.transactionsTotalRecords = 0;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.errors?.[0]?.defaultUserMessage || err?.message || 'Error loading vault data';
        this.transactionsDataSource.data = [];
        this.transactionsTotalRecords = 0;
      }
    });
  }

  loadTransactions(): void {
    const officeId = this.officeId!;
    const glAccountId = this.vaultGlAccountId!;
    this.vaultService.getVaultTransactions(officeId, glAccountId, undefined, undefined, 0, 100).subscribe({
      next: (res) => {
        const items = (res.pageItems || []).map((entry: any) => ({
          ...entry,
          signedAmount: this.computeSignedAmount(entry)
        }));
        this.transactionsDataSource.data = items;
        this.transactionsTotalRecords = res.totalFilteredRecords ?? 0;
        this.transactionsDataSource.paginator = this.paginator;
        this.transactionsDataSource.sort = this.sort;
      },
      error: () => {
        this.transactionsDataSource.data = [];
        this.transactionsTotalRecords = 0;
      }
    });
  }

  openAllocateDialog(): void {
    const ref = this.dialog.open(VaultAllocateCashDialogComponent, {
      width: '560px',
      disableClose: false
    });
    ref.afterClosed().subscribe((result) => {
      if (result === true) {
        this.loadVaultData();
      }
    });
  }

  getRunningBalance(entry: any): number | null {
    if (entry?.officeRunningBalance != null) return Number(entry.officeRunningBalance);
    if (entry?.runningBalance != null) return Number(entry.runningBalance);
    return null;
  }

  /**
   * Returns amount with sign: positive for CREDIT, negative for DEBIT.
   * Used for display and for sortable signedAmount on the data source.
   */
  getSignedAmount(entry: any): number | null {
    return this.computeSignedAmount(entry);
  }

  private computeSignedAmount(entry: any): number | null {
    if (entry?.amount == null) return null;
    const type = entry?.entryType?.value ?? entry?.glAccountType?.value ?? '';
    const amount = Number(entry.amount);
    return type === 'CREDIT' ? amount : -amount;
  }
}
