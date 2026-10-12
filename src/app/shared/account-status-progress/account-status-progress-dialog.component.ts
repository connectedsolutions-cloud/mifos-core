import { Component, Inject, ViewEncapsulation } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgClass } from '@angular/common';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import {
  AccountKind,
  AccountStatusProgress,
  AccountStatusStep,
  AccountStatusStepDates,
  AccountStatusStepState,
  accountStatusProgressOffPathLabel,
  accountStatusProgressSubtitle,
  accountStatusStepStateLabel,
  buildAccountStatusProgress
} from './account-status-progress';

export interface AccountStatusProgressDialogData {
  accountKind: AccountKind;
  statusCode: string;
  statusLabel: string;
  stepDates?: AccountStatusStepDates | null;
}

@Component({
  selector: 'mifosx-account-status-progress-dialog',
  templateUrl: './account-status-progress-dialog.component.html',
  styleUrls: ['./account-status-progress-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    NgClass
  ]
})
export class AccountStatusProgressDialogComponent {
  readonly subtitle: string;
  readonly offPathLabel: string;
  readonly progress: AccountStatusProgress;

  constructor(@Inject(MAT_DIALOG_DATA) public data: AccountStatusProgressDialogData) {
    this.subtitle = accountStatusProgressSubtitle(data.accountKind);
    this.offPathLabel = accountStatusProgressOffPathLabel(data.accountKind);
    this.progress = buildAccountStatusProgress(data.accountKind, data.statusCode, data.stepDates);
  }

  stepStateLabel(state: AccountStatusStepState): string {
    return accountStatusStepStateLabel(state);
  }

  stepStatusClass(stepId: AccountStatusStep['id']): string {
    switch (stepId) {
      case 'submitted':
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'active':
        return 'status-active';
    }
  }
}
