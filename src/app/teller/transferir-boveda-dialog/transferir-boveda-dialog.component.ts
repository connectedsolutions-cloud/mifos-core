import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PendientesService } from 'app/pendientes/pendientes.service';
import { UsersService } from 'app/users/users.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

const BLUEPRINT_NAME = 'teller-vault-transfer';

const EXCLUDED_USER_EMAILS = [
  'demomfi@mifos.org',
  'email@email.com'
];

export interface TransferirBovedaDialogData {
  cashierId: number;
  currencyCode: string;
}

@Component({
  selector: 'mifosx-transferir-boveda-dialog',
  templateUrl: './transferir-boveda-dialog.component.html',
  styleUrls: ['./transferir-boveda-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class TransferirBovedaDialogComponent implements OnInit {
  form: FormGroup;
  users: any[] = [];
  blueprintId: number | null = null;
  blueprintError: string | null = null;
  submitting = false;
  submitError: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TransferirBovedaDialogData,
    private dialogRef: MatDialogRef<TransferirBovedaDialogComponent>,
    private fb: FormBuilder,
    private pendientesService: PendientesService,
    private usersService: UsersService,
    private authenticationService: AuthenticationService
  ) {
    this.form = this.fb.group({
      amount: [
        null as
          | number
          | null,
        [
          Validators.required,
          Validators.min(0.01)]

      ],
      responsableUserId: [
        null as
          | number
          | null,
        Validators.required

      ],
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
    if (
      !this.canSubmit ||
      this.blueprintId == null ||
      this.data?.cashierId == null ||
      this.data?.currencyCode == null
    ) {
      return;
    }
    this.submitting = true;
    this.submitError = null;

    const value = this.form.getRawValue();
    const amountNum = Number(value.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      this.submitError = 'Invalid amount';
      this.submitting = false;
      return;
    }
    const amountStr = amountNum.toFixed(2);

    const credentials = this.authenticationService.getCredentials();
    const currentOfficeId = credentials?.officeId;

    const payload: any = {
      responsableUserId: value.responsableUserId,
      description: value.description || undefined,
      cashierId: this.data.cashierId,
      amount: amountStr,
      currencyCode: this.data.currencyCode
    };
    if (currentOfficeId != null && currentOfficeId !== 0) {
      payload.officeId = currentOfficeId;
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
