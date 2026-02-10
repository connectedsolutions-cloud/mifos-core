import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-aperturar-caja-dialog',
  templateUrl: './aperturar-caja-dialog.component.html',
  styleUrls: ['./aperturar-caja-dialog.component.scss'],
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
export class AperturarCajaDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AperturarCajaDialogComponent>,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      openingAmount: [
        '',
        [
          Validators.required,
          this.currencyMinValidator(0)]
      ]
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

  formatOpeningAmount(): void {
    const control = this.form.get('openingAmount');
    const raw = control?.value?.toString().replace(/,/g, '') ?? '';
    if (raw === '') return;
    const num = Number(raw);
    if (!isNaN(num) && num >= 0) {
      control?.setValue(num.toFixed(2), { emitEvent: true });
    }
  }

  get openingAmount(): number | null {
    const v = this.form.get('openingAmount')?.value;
    if (v === '' || v == null) return null;
    const num = Number(String(v).replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }

  confirm(): void {
    if (this.form.valid) {
      const amount = this.openingAmount;
      this.dialogRef.close(amount != null ? amount : 0);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
