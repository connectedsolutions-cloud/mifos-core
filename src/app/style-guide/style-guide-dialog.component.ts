import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'mifosx-style-guide-dialog',
  template: `
    <h2 mat-dialog-title>Asignar asesor</h2>
    <mat-dialog-content>
      <p>El cliente queda asignado a ayala, robert empleado 3.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" mat-dialog-close>Guardar</button>
    </mat-dialog-actions>
  `,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton
  ]
})
export class StyleGuideDialogComponent {}
