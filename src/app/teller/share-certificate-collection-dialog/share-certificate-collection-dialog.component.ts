import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { SharesService } from 'app/shares/shares.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

export interface ShareCertificateCollectionDialogData {
  cashierId: number;
  officeId: number;
}

@Component({
  selector: 'mifosx-share-certificate-collection-dialog',
  templateUrl: './share-certificate-collection-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class ShareCertificateCollectionDialogComponent implements OnInit {
  form: FormGroup;
  accounts: any[] = [];
  submitError = '';

  constructor(
    private formBuilder: FormBuilder,
    private sharesService: SharesService,
    private settingsService: SettingsService,
    private dateUtils: Dates,
    private dialogRef: MatDialogRef<ShareCertificateCollectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShareCertificateCollectionDialogData
  ) {
    this.form = this.formBuilder.group({
      shareAccountId: [
        '',
        Validators.required
      ],
      transactionDate: [
        this.settingsService.businessDate || new Date(),
        Validators.required
      ]
    });
  }

  ngOnInit() {
    this.sharesService.getApprovedUnpaidShareAccounts(this.data.officeId).subscribe((accounts) => {
      this.accounts = accounts || [];
    });
  }

  get selectedAccount(): any {
    return this.accounts.find((account) => account.id === this.form.value.shareAccountId);
  }

  submit() {
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const transactionDateValue = this.form.value.transactionDate;
    const transactionDate =
      transactionDateValue instanceof Date
        ? this.dateUtils.formatDate(transactionDateValue, dateFormat)
        : transactionDateValue;
    this.sharesService
      .executeSharesAccountCommand(String(this.form.value.shareAccountId), 'collectcash', {
        cashierId: this.data.cashierId,
        transactionDate,
        dateFormat,
        locale
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error) => {
          this.submitError =
            error?.error?.defaultUserMessage ||
            error?.error?.errors?.[0]?.defaultUserMessage ||
            'Unable to record the cash collection';
        }
      });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
