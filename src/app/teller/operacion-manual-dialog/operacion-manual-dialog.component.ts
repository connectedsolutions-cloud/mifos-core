import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { OrganizationService } from 'app/organization/organization.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

export interface OperacionManualDialogData {
  tellerId: number;
  cashierId: number;
  currencyCode: string;
  efectivoEnCaja?: number | null;
}

@Component({
  selector: 'mifosx-operacion-manual-dialog',
  templateUrl: './operacion-manual-dialog.component.html',
  styleUrls: ['./operacion-manual-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class OperacionManualDialogComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  submitError: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: OperacionManualDialogData,
    private dialogRef: MatDialogRef<OperacionManualDialogComponent>,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    private settingsService: SettingsService,
    private dateUtils: Dates
  ) {
    this.form = this.fb.group({
      operation: [
        'deposit' as
          | 'deposit'
          | 'withdrawal',
        Validators.required

      ],
      amount: [
        null as
          | number
          | null,
        [
          Validators.required,
          Validators.min(0.01)]

      ],
      txnNote: [
        '',
        [
          Validators.required,
          Validators.maxLength(200),
          OperacionManualDialogComponent.noteNotBlank
        ]
      ]
    });
  }

  private static noteNotBlank(control: AbstractControl): ValidationErrors | null {
    const s = (control.value as string)?.trim();
    if (!s) {
      return { required: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.form.get('amount')?.addValidators((c) => this.amountWithdrawalValidator(c));
    this.form.get('amount')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('operation')?.valueChanges.subscribe(() => {
      this.form.get('amount')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private amountWithdrawalValidator(control: AbstractControl): ValidationErrors | null {
    const op = control.parent?.get('operation')?.value;
    if (op !== 'withdrawal') {
      return null;
    }
    const amt = Number(control.value);
    const max = this.data.efectivoEnCaja;
    if (max == null || Number.isNaN(amt)) {
      return null;
    }
    if (amt > max) {
      return { exceedsCash: true };
    }
    return null;
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.submitting;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (!this.canSubmit) {
      return;
    }
    this.submitting = true;
    this.submitError = null;
    const v = this.form.getRawValue();
    const dateFormat = this.settingsService.dateFormat;
    const locale = this.settingsService.language.code;
    const txnDate = this.dateUtils.formatDate(this.settingsService.businessDate, dateFormat);
    const payload = {
      txnDate,
      currencyCode: this.data.currencyCode,
      txnAmount: Number(v.amount),
      txnNote: (v.txnNote as string).trim(),
      dateFormat,
      locale
    };
    const obs =
      v.operation === 'deposit'
        ? this.organizationService.allocateCash(String(this.data.tellerId), String(this.data.cashierId), payload)
        : this.organizationService.settleCash(String(this.data.tellerId), String(this.data.cashierId), payload);
    obs.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.submitting = false;
        this.submitError =
          err?.error?.errors?.[0]?.defaultUserMessage ?? err?.error?.defaultUserMessage ?? err?.message ?? 'Error';
      }
    });
  }
}
