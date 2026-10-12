import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TreasuryService } from './treasury.service';

@Component({
  selector: 'mifosx-treasury-bank-hint',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  template: ` <p *ngIf="bankName">{{ 'labels.text.treasury.postsToBank' | translate }}: {{ bankName }}</p> `
})
export class TreasuryBankHintComponent implements OnInit {
  @Input() form: FormGroup | null = null;
  @Input() productType = 'savings';
  @Input() productId: number | null = null;
  bankName = '';

  constructor(private treasuryService: TreasuryService) {}

  ngOnInit(): void {
    this.form?.get('paymentTypeId')?.valueChanges.subscribe((paymentTypeId) => this.lookup(paymentTypeId));
    this.lookup(this.form?.get('paymentTypeId')?.value);
  }

  private lookup(paymentTypeId: number): void {
    if (!this.productId || !paymentTypeId) {
      this.bankName = '';
      return;
    }
    this.treasuryService.matchBank(this.productType, this.productId, paymentTypeId).subscribe({
      next: (bank) => {
        this.bankName = bank?.name || '';
      },
      error: () => {
        this.bankName = '';
      }
    });
  }
}
