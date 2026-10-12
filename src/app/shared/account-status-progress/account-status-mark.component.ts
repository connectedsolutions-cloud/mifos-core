import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { StatusLookupPipe } from 'app/pipes/status-lookup.pipe';
import { AccountKind, AccountStatusStepDates } from './account-status-progress';
import { AccountStatusProgressDialogComponent } from './account-status-progress-dialog.component';

@Component({
  selector: 'mifosx-account-status-mark',
  templateUrl: './account-status-mark.component.html',
  styleUrls: ['./account-status-mark.component.scss'],
  imports: [
    MatTooltip,
    NgClass,
    StatusLookupPipe
  ]
})
export class AccountStatusMarkComponent {
  @Input({ required: true }) accountKind!: AccountKind;
  @Input({ required: true }) statusCode!: string;
  @Input({ required: true }) statusLabel!: string;
  @Input() colorCode?: string;
  @Input() appearance: 'stop' | 'square' = 'stop';
  @Input() stepDates?: AccountStatusStepDates | null;

  constructor(private dialog: MatDialog) {}

  openProgress(event: Event): void {
    (event.currentTarget as HTMLElement).blur();
    this.dialog.open(AccountStatusProgressDialogComponent, {
      data: {
        accountKind: this.accountKind,
        statusCode: this.statusCode,
        statusLabel: this.statusLabel,
        stepDates: this.stepDates
      },
      width: '460px',
      panelClass: 'account-status-progress-panel'
    });
  }
}
