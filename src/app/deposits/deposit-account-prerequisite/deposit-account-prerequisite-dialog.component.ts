import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-deposit-account-prerequisite-dialog',
  templateUrl: './deposit-account-prerequisite-dialog.component.html',
  styleUrls: ['./deposit-account-prerequisite-dialog.component.scss'],
  standalone: true,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogModule,
    MatButtonModule
  ]
})
export class DepositAccountPrerequisiteDialogComponent {
  constructor(private dialogRef: MatDialogRef<DepositAccountPrerequisiteDialogComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}
