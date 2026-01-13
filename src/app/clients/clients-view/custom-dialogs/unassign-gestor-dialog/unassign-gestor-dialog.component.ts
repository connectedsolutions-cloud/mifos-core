/** Angular Imports */
import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Unassign gestor dialog component.
 */
@Component({
  selector: 'mifosx-unassign-gestor-dialog',
  templateUrl: './unassign-gestor-dialog.component.html',
  styleUrls: ['./unassign-gestor-dialog.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class UnassignGestorDialogComponent {
  /**
   * @param {MatDialogRef} dialogRef Component reference to dialog.
   */
  constructor(public dialogRef: MatDialogRef<UnassignGestorDialogComponent>) {}
}
