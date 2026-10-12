import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SettingsService } from '../settings/settings.service';
import { Dates } from '../core/utils/dates';
import { TreasuryService } from './treasury.service';

@Component({
  selector: 'mifosx-treasury-movement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ 'labels.text.treasury.newMovement' | translate }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="layout-column">
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.type' | translate }}</mat-label>
          <mat-select formControlName="type">
            <mat-option *ngFor="let type of types" [value]="type">{{ type }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.bank' | translate }}</mat-label>
          <mat-select formControlName="bankAccountId">
            <mat-option *ngFor="let bank of data.banks" [value]="bank.id">{{ bankLabel(bank) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field *ngIf="form.value.type === 'bank_transfer'">
          <mat-label>{{ 'labels.text.treasury.destinationBank' | translate }}</mat-label>
          <mat-select formControlName="destinationBankAccountId">
            <mat-option *ngFor="let bank of data.banks" [value]="bank.id">{{ bankLabel(bank) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field *ngIf="needsCounter">
          <mat-label>{{ 'labels.text.treasury.counterGl' | translate }}</mat-label>
          <input matInput type="number" formControlName="counterGlAccountId" />
        </mat-form-field>
        <mat-form-field *ngIf="form.value.type === 'opening_balance'">
          <mat-label>{{ 'labels.text.treasury.direction' | translate }}</mat-label>
          <mat-select formControlName="direction">
            <mat-option value="debit">debit</mat-option>
            <mat-option value="credit">credit</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.amount' | translate }}</mat-label>
          <input matInput formControlName="amount" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.payee' | translate }}</mat-label>
          <input matInput formControlName="payeeName" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.bankReference' | translate }}</mat-label>
          <input matInput formControlName="bankReference" />
        </mat-form-field>
        <p *ngIf="error">{{ error }}</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button type="button" (click)="dialogRef.close()">{{ 'labels.buttons.Cancel' | translate }}</button>
        <button mat-raised-button color="primary" type="submit">{{ 'labels.buttons.Submit' | translate }}</button>
      </mat-dialog-actions>
    </form>
  `
})
export class TreasuryMovementDialogComponent {
  types = [
    'opening_balance',
    'bank_transfer',
    'bank_debit',
    'bank_credit',
    'fund_vault',
    'vault_to_bank',
    'employee_payment',
    'provider_payment'
  ];
  error = '';
  form = this.formBuilder.group({
    type: [
      'opening_balance',
      Validators.required
    ],
    bankAccountId: [
      null,
      Validators.required
    ],
    destinationBankAccountId: [null],
    counterGlAccountId: [null],
    direction: ['debit'],
    amount: [
      null,
      Validators.required
    ],
    payeeName: [''],
    bankReference: ['']
  });

  constructor(
    private formBuilder: FormBuilder,
    private treasuryService: TreasuryService,
    private settingsService: SettingsService,
    private dateUtils: Dates,
    public dialogRef: MatDialogRef<TreasuryMovementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { banks: any[]; officeId: number }
  ) {}

  bankLabel(bank: any): string {
    return this.treasuryService.bankLabel(bank);
  }

  get needsCounter(): boolean {
    return [
      'bank_debit',
      'bank_credit',
      'employee_payment',
      'provider_payment'
    ].includes(this.form.value.type || '');
  }

  submit(): void {
    const value = this.form.value;
    const businessDate = this.dateUtils.formatDate(this.settingsService.businessDate, this.settingsService.dateFormat);
    this.treasuryService
      .createMovement({
        ...value,
        officeId: this.data.officeId,
        businessDate,
        valueDate: businessDate,
        dateFormat: this.settingsService.dateFormat,
        locale: this.settingsService.language.code
      })
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (err) =>
          (this.error = err?.error?.errors?.[0]?.defaultUserMessage || err?.error?.defaultUserMessage || 'Error')
      });
  }
}
