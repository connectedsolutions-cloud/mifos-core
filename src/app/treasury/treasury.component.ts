import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TreasuryService } from './treasury.service';
import { TreasuryMovementDialogComponent } from './treasury-movement-dialog.component';
import { TreasuryBankDialogComponent } from './treasury-bank-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { AuthenticationService } from '../core/authentication/authentication.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'mifosx-treasury',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './treasury.component.html'
})
export class TreasuryComponent implements OnInit {
  banks: any[] = [];
  selectedBank: any;
  movements: any[] = [];
  columns = [
    'businessDate',
    'valueDate',
    'type',
    'debit',
    'credit',
    'payeeName',
    'bankReference',
    'balanceAfter',
    'refNum',
    'links',
    'status'
  ];
  error = '';
  canCreateMovement = false;
  canManageBank = false;
  canReverse = false;
  filterType = '';
  filterPayee = '';
  historicalCheques: any[] = [];
  chequeColumns = [
    'kind',
    'chequeNumber',
    'bank',
    'amount',
    'date',
    'cancelled',
    'relationships'
  ];
  chequeError = '';
  chequeFilters = {
    number: '',
    exact: '',
    bank: '',
    kind: '',
    fromDate: '',
    toDate: '',
    amount: '',
    sort: 'date',
    order: 'desc'
  };

  constructor(
    private treasuryService: TreasuryService,
    private dialog: MatDialog,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const permissions: string[] = this.authenticationService.getCredentials()?.permissions || [];
    this.canCreateMovement = permissions.includes('ALL_FUNCTIONS') || permissions.includes('CREATE_TREASURY_MOVEMENT');
    this.canManageBank = permissions.includes('ALL_FUNCTIONS') || permissions.includes('CREATE_TREASURY_BANKACCOUNT');
    this.canReverse = permissions.includes('ALL_FUNCTIONS') || permissions.includes('REVERSE_TREASURY_MOVEMENT');
    this.loadHistoricalCheques();
    this.treasuryService.getBanks().subscribe({
      next: (banks) => {
        this.banks = banks;
        if (banks.length) {
          this.selectBank(banks[0]);
        }
      },
      error: () => (this.error = 'labels.text.treasury.loadError')
    });
  }

  selectBank(bank: any): void {
    this.selectedBank = bank;
    this.loadMovements();
  }

  selectBankById(bankId: any): void {
    const bank = this.banks.find((candidate) => candidate.id === bankId);
    if (bank) {
      this.selectBank(bank);
    }
  }

  bankLabel(bank: any): string {
    return this.treasuryService.bankLabel(bank);
  }

  loadMovements(): void {
    if (!this.selectedBank) {
      return;
    }
    this.treasuryService
      .getMovements(this.selectedBank.id, {
        type: this.filterType || undefined,
        payee: this.filterPayee || undefined
      })
      .subscribe({
        next: (rows) => (this.movements = rows),
        error: () => (this.error = 'labels.text.treasury.loadError')
      });
  }

  openBank(): void {
    const ref = this.dialog.open(TreasuryBankDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.ngOnInit();
      }
    });
  }

  lineForBank(movement: any): any {
    return (
      (movement.lines || []).find((line: any) => line.bankAccountId === this.selectedBank?.id) ||
      movement.lines?.[0] ||
      {}
    );
  }

  openMovement(): void {
    const ref = this.dialog.open(TreasuryMovementDialogComponent, {
      width: '520px',
      data: { banks: this.banks, officeId: this.authenticationService.getCredentials()?.officeId }
    });
    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.ngOnInit();
      }
    });
  }

  reverse(movement: any): void {
    this.treasuryService.reverseMovement(movement.id).subscribe({
      next: () => this.selectBank(this.selectedBank),
      error: (err) => (this.error = err?.error?.defaultUserMessage || 'labels.text.treasury.reverseError')
    });
  }

  loadHistoricalCheques(): void {
    this.chequeError = '';
    this.treasuryService.getHistoricalCheques(this.chequeFilters).subscribe({
      next: (rows) => (this.historicalCheques = rows),
      error: () => (this.chequeError = 'labels.text.treasury.chequeLoadError')
    });
  }

  exportHistoricalCheques(): void {
    this.treasuryService.exportHistoricalCheques(this.chequeFilters).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'historical-cheques.csv';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => (this.chequeError = 'labels.text.treasury.chequeLoadError')
    });
  }

  relationshipLabel(type: string): string {
    return `labels.text.treasury.relationship.${type}`;
  }

  linkRoute(link: any): string[] | null {
    if (!link?.targetType || !link?.targetId) return null;
    if (link.targetType === 'gl_journal') return [
        '/accounting/journal-entries/transactions/view',
        link.targetId
      ];
    const parts = String(link.targetId).split('|');
    if (parts.length !== 3) return null;
    if (link.targetType === 'loan_transaction') {
      return [
        '/clients',
        parts[0],
        'loans-accounts',
        parts[1],
        'transactions',
        parts[2]
      ];
    }
    if (link.targetType === 'savings_transaction') {
      return [
        '/clients',
        parts[0],
        'savings-accounts',
        parts[1],
        'transactions',
        parts[2]
      ];
    }
    return null;
  }
}
