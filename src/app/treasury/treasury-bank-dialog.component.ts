import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TreasuryService } from './treasury.service';

@Component({
  selector: 'mifosx-treasury-bank-dialog',
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
  styles: [
    `
      mat-dialog-content {
        display: flex;
        flex-direction: column;
        min-width: 360px;
      }

      mat-form-field {
        width: 100%;
      }
    `

  ],
  template: `
    <h2 mat-dialog-title>{{ 'labels.text.treasury.registerBank' | translate }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="layout-column">
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.bank' | translate }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.accountNumber' | translate }}</mat-label>
          <input matInput formControlName="externalAccountReference" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.alias' | translate }}</mat-label>
          <input matInput formControlName="alias" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.glAccount' | translate }}</mat-label>
          <mat-select formControlName="glAccountId">
            <mat-option *ngFor="let account of glAccounts" [value]="account.id">
              {{ account.glCode }} — {{ account.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'labels.text.treasury.currency' | translate }}</mat-label>
          <input matInput formControlName="currencyCode" />
        </mat-form-field>
        <p *ngIf="error">{{ error | translate }}</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button type="button" (click)="dialogRef.close()">{{ 'labels.buttons.Cancel' | translate }}</button>
        <button mat-raised-button color="primary" type="submit">{{ 'labels.buttons.Submit' | translate }}</button>
      </mat-dialog-actions>
    </form>
  `
})
export class TreasuryBankDialogComponent implements OnInit {
  error = '';
  glAccounts: any[] = [];
  form = this.formBuilder.group({
    name: [
      '',
      Validators.required
    ],
    externalAccountReference: [
      '',
      Validators.required
    ],
    alias: [''],
    glAccountId: [
      null as
        | number
        | null,
      Validators.required

    ],
    currencyCode: [
      'USD',
      Validators.required
    ]
  });

  constructor(
    private formBuilder: FormBuilder,
    private treasuryService: TreasuryService,
    public dialogRef: MatDialogRef<TreasuryBankDialogComponent>
  ) {}

  ngOnInit(): void {
    this.treasuryService.getAssetDetailAccounts().subscribe({
      next: (accounts) => (this.glAccounts = accounts || []),
      error: () => (this.error = 'labels.text.treasury.loadError')
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    this.treasuryService
      .createBank({
        ...value,
        alias: value.alias || null
      })
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (err) =>
          (this.error = err?.error?.errors?.[0]?.defaultUserMessage || err?.error?.defaultUserMessage || 'Error')
      });
  }
}
