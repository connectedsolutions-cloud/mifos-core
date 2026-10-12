/** Angular Imports */
import { Component, Inject, Optional } from '@angular/core';
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

export interface UnassignStaffDialogData {
  headingKey?: string;
  textKey?: string;
}

/**
 * Unassign staff-role dialog component.
 */
@Component({
  selector: 'mifosx-unassign-staff-dialog',
  templateUrl: './unassign-staff-dialog.component.html',
  styleUrls: ['./unassign-staff-dialog.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class UnassignStaffDialogComponent {
  headingKey: string;
  textKey: string;

  constructor(
    public dialogRef: MatDialogRef<UnassignStaffDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: UnassignStaffDialogData | null
  ) {
    this.headingKey = data?.headingKey || 'Unassign Staff';
    this.textKey = data?.textKey || 'Unassign Staff client';
  }
}
