import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PendientesService } from '../../pendientes/pendientes.service';
import { UsersService } from '../../users/users.service';
import { AuthenticationService } from '../../core/authentication/authentication.service';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

const BLUEPRINT_NAME = 'transferencia_efectivo-comite_otrgamiento';

const EXCLUDED_USER_EMAILS = [
  'demomfi@mifos.org',
  'email@email.com'
];

export interface CrearPendienteTransferirFondosDialogData {
  sessionId: number;
}

@Component({
  selector: 'mifosx-crear-pendiente-transferir-fondos-dialog',
  templateUrl: './crear-pendiente-transferir-fondos-dialog.component.html',
  styleUrls: ['./crear-pendiente-transferir-fondos-dialog.component.scss'],
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
export class CrearPendienteTransferirFondosDialogComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  blueprintId: number | null = null;
  blueprintError: string | null = null;
  submitting = false;
  submitError: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CrearPendienteTransferirFondosDialogData,
    private dialogRef: MatDialogRef<CrearPendienteTransferirFondosDialogComponent>,
    private fb: FormBuilder,
    private pendientesService: PendientesService,
    private usersService: UsersService,
    private authenticationService: AuthenticationService
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
    forkJoin({
      blueprints: this.pendientesService.getBlueprints(),
      users: this.usersService.getUsers()
    }).subscribe({
      next: ({ blueprints, users }) => {
        const list = Array.isArray(blueprints) ? blueprints : (blueprints?.pageItems ?? []);
        const blueprint = list.find((b: any) => b.name === BLUEPRINT_NAME);
        if (blueprint?.id != null) {
          this.blueprintId = Number(blueprint.id);
          this.blueprintError = null;
        } else {
          this.blueprintError = `Blueprint "${BLUEPRINT_NAME}" not found`;
        }

        const usersArray = Array.isArray(users) ? users : (users?.pageItems ?? []);
        const excludedSet = new Set(EXCLUDED_USER_EMAILS.map((e) => e.toLowerCase()));
        this.users = usersArray
          .filter((u: any) => !excludedSet.has((u.email || '').toLowerCase()))
          .map((u: any) => ({
            ...u,
            displayName: u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.username || ''
          }));
      },
      error: (err) => {
        console.error('Error loading blueprints or users:', err);
        this.blueprintError = 'Failed to load blueprints or users';
      }
    });
  }

  get canSubmit(): boolean {
    return this.form.valid && this.blueprintId != null && this.blueprintError == null && !this.submitting;
  }

  submit(): void {
    if (!this.canSubmit || this.blueprintId == null || this.data?.sessionId == null) {
      return;
    }
    this.submitting = true;
    this.submitError = null;

    const value = this.form.getRawValue();
    const dueDate = value.dueDate as Date | null;
    const credentials = this.authenticationService.getCredentials();
    const currentOfficeId = credentials?.officeId;

    const payload: any = {
      responsableUserId: value.responsableUserId,
      description: value.description || undefined,
      sesionComiteId: this.data.sessionId
    };
    if (currentOfficeId != null && currentOfficeId !== 0) {
      payload.officeId = currentOfficeId;
    }
    if (dueDate) {
      payload.dueDate = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
        12,
        0,
        0,
        0
      ).toISOString();
    }

    this.pendientesService.createFlow(this.blueprintId, payload).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.errors?.[0]?.defaultUserMessage || err?.message || 'Error creating pending flow';
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
