import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { UsersService } from '../../users/users.service';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';

export interface CompleteStepNextDialogData {
  /** Next step name (from blueprint or custom). Shown as context for "Set next step details". */
  nextStepName?: string;
  /** Optional next step description from blueprint. */
  nextStepDescription?: string;
}

export interface CompleteStepNextDialogResult {
  responsableUserId: number;
  dueDate: Date | null;
  description?: string;
}

@Component({
  selector: 'mifosx-complete-step-next-dialog',
  templateUrl: './complete-step-next-dialog.component.html',
  styleUrls: ['./complete-step-next-dialog.component.scss'],
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class CompleteStepNextDialogComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  loadError: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CompleteStepNextDialogData,
    private dialogRef: MatDialogRef<CompleteStepNextDialogComponent>,
    private fb: FormBuilder,
    private usersService: UsersService
  ) {
    this.form = this.fb.group({
      responsableUserId: [
        null as
          | number
          | null,
        Validators.required

      ],
      dueDate: [null as Date | null],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        const usersArray = Array.isArray(users) ? users : (users?.pageItems ?? []);
        this.users = usersArray.map((u: any) => ({
          ...u,
          displayName: u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.username || ''
        }));
        this.loadError = null;
      },
      error: () => {
        this.loadError = 'Error loading users';
      }
    });
  }

  get canSubmit(): boolean {
    return this.form.valid && this.loadError == null;
  }

  submit(): void {
    if (!this.canSubmit) return;
    const value = this.form.getRawValue();
    const result: CompleteStepNextDialogResult = {
      responsableUserId: value.responsableUserId,
      dueDate: value.dueDate ?? null,
      description: value.description || undefined
    };
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
