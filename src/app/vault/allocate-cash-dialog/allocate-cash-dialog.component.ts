import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { Dates } from '../../core/utils/dates';
import { VaultService } from '../vault.service';
import { OrganizationService } from '../../organization/organization.service';
import { SettingsService } from '../../settings/settings.service';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';

@Component({
  selector: 'mifosx-vault-allocate-cash-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    DateFormatPipe,
    ...STANDALONE_SHARED_IMPORTS
  ],
  templateUrl: './allocate-cash-dialog.component.html',
  styleUrls: ['./allocate-cash-dialog.component.scss']
})
export class VaultAllocateCashDialogComponent implements OnInit {
  form: UntypedFormGroup;
  minDate = new Date(2000, 0, 1);
  maxDate = new Date();

  officeName = '';
  officeId: number | null = null;
  tellers: any[] = [];
  cashiers: any[] = [];
  currencyOptions: { code: string; name: string }[] = [];

  loadingTellers = false;
  loadingCashiers = false;
  loadingTemplate = false;
  submitting = false;
  error: string | null = null;

  constructor(
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<VaultAllocateCashDialogComponent>,
    private dates: Dates,
    private vaultService: VaultService,
    private organizationService: OrganizationService,
    private settingsService: SettingsService
  ) {
    this.officeId = this.vaultService.getCurrentOfficeId();
    this.officeName = this.vaultService.getCurrentOfficeName();
    this.form = this.fb.group({
      tellerId: [
        '',
        Validators.required
      ],
      cashierId: [
        '',
        Validators.required
      ],
      txnDate: [
        new Date(),
        Validators.required
      ],
      currencyCode: [
        '',
        Validators.required
      ],
      txnAmount: [
        '',
        Validators.required
      ],
      txnNote: [
        '',
        Validators.required
      ]
    });
  }

  ngOnInit(): void {
    this.maxDate = this.settingsService.businessDate || new Date();
    this.loadTellers();
    this.form.get('tellerId')?.valueChanges.subscribe((tellerId) => {
      this.form.patchValue({ cashierId: '' });
      this.cashiers = [];
      this.currencyOptions = [];
      if (tellerId) {
        this.loadCashiers(tellerId);
      }
    });
    this.form.get('cashierId')?.valueChanges.subscribe((cashierId) => {
      this.currencyOptions = [];
      const tellerId = this.form.get('tellerId')?.value;
      if (tellerId && cashierId) {
        this.loadTemplate(tellerId, cashierId);
      }
    });
  }

  loadTellers(): void {
    if (this.officeId == null) return;
    this.loadingTellers = true;
    this.organizationService.getTellers(this.officeId).subscribe({
      next: (data: any) => {
        this.tellers = Array.isArray(data) ? data : (data?.tellers ?? data ?? []);
        this.loadingTellers = false;
      },
      error: () => {
        this.tellers = [];
        this.loadingTellers = false;
      }
    });
  }

  loadCashiers(tellerId: string): void {
    this.loadingCashiers = true;
    this.organizationService.getCashiers(tellerId).subscribe({
      next: (data: any) => {
        const list = data?.cashiers ?? data;
        this.cashiers = Array.isArray(list) ? list : [];
        this.loadingCashiers = false;
      },
      error: () => {
        this.cashiers = [];
        this.loadingCashiers = false;
      }
    });
  }

  loadTemplate(tellerId: string, cashierId: string): void {
    this.loadingTemplate = true;
    this.organizationService.getCashierTransactionTemplate(tellerId, cashierId).subscribe({
      next: (data: any) => {
        this.currencyOptions = data?.currencyOptions ?? [];
        this.loadingTemplate = false;
        if (this.currencyOptions.length === 1) {
          this.form.patchValue({ currencyCode: this.currencyOptions[0].code });
        }
      },
      error: () => {
        this.currencyOptions = [];
        this.loadingTemplate = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    this.error = null;
    this.submitting = true;
    const value = this.form.value;
    const dateFormat = this.settingsService.dateFormat;
    const locale = this.settingsService.language.code;
    const txnDate = value.txnDate instanceof Date ? this.dates.formatDate(value.txnDate, dateFormat) : value.txnDate;
    const data = {
      txnDate,
      currencyCode: value.currencyCode,
      txnAmount: value.txnAmount,
      txnNote: value.txnNote,
      dateFormat,
      locale
    };
    this.organizationService.allocateCash(value.tellerId, value.cashierId, data).subscribe({
      next: () => {
        this.submitting = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.errors?.[0]?.defaultUserMessage || err?.message || 'Error submitting allocation';
      }
    });
  }
}
