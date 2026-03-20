import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

export interface CierreCajaDialogData {
  currencyCode: string;
  dateFormat: string;
  locale: string;
  suggestedAmount?: number;
}

export interface CierreCajaDialogResult {
  closingAmount: number;
  note?: string;
}

@Component({
  selector: 'mifosx-cierre-caja-dialog',
  templateUrl: './cierre-caja-dialog.component.html',
  styleUrls: ['./cierre-caja-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class CierreCajaDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<CierreCajaDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: CierreCajaDialogData
  ) {
    const suggested = data?.suggestedAmount;
    this.form = this.fb.group({
      closingAmount: [
        suggested != null ? suggested.toString() : '',
        [
          Validators.required,
          this.currencyMinValidator(0)]
      ],
      note: ['']
    });
  }

  private currencyMinValidator(min: number) {
    return (control: { value: string }) => {
      const num = Number(control.value?.replace(/,/g, ''));
      if (control.value === '' || control.value == null) return null;
      if (isNaN(num)) return { invalidNumber: true };
      if (num < min) return { min: true };
      return null;
    };
  }

  formatClosingAmount(): void {
    const control = this.form.get('closingAmount');
    const raw = control?.value?.toString().replace(/,/g, '') ?? '';
    if (raw === '') return;
    const num = Number(raw);
    if (!isNaN(num) && num >= 0) {
      control?.setValue(num.toFixed(2), { emitEvent: true });
    }
  }

  get closingAmount(): number | null {
    const v = this.form.get('closingAmount')?.value;
    if (v === '' || v == null) return null;
    const num = Number(String(v).replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }

  confirm(): void {
    if (this.form.valid) {
      const amount = this.closingAmount;
      const note = this.form.get('note')?.value?.trim() || undefined;
      this.dialogRef.close({
        closingAmount: amount != null ? amount : 0,
        note
      } as CierreCajaDialogResult);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
