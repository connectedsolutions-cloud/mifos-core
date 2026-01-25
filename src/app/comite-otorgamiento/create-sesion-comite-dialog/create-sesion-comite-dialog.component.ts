import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComiteOtorgamientoService } from '../comite-otorgamiento.service';
import { UsersService } from '../../users/users.service';
import { AuthenticationService } from '../../core/authentication/authentication.service';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

/** Mifos native/demo emails to exclude from participants list */
const EXCLUDED_USER_EMAILS = [
  'demomfi@mifos.org',
  'email@email.com'
];

@Component({
  selector: 'mifosx-create-sesion-comite-dialog',
  templateUrl: './create-sesion-comite-dialog.component.html',
  styleUrls: ['./create-sesion-comite-dialog.component.scss'],
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
export class CreateSesionComiteDialogComponent implements OnInit {
  createForm: FormGroup;
  users: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<CreateSesionComiteDialogComponent>,
    private fb: FormBuilder,
    private service: ComiteOtorgamientoService,
    private usersService: UsersService,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const defaultName = this.generateDefaultName();
    this.createForm = this.fb.group({
      name: [
        defaultName,
        Validators.required
      ],
      integrantes: [
        [],
        Validators.required
      ],
      description: ['']
    });

    this.loadUsers();
  }

  private generateDefaultName(): string {
    const credentials = this.authenticationService.getCredentials();
    const username = credentials?.username || 'user';
    const officeName = credentials?.officeName || '';

    // Format date as dd/mm/yyyy
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    return `${officeName} - ${formattedDate}`;
  }

  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (response: any) => {
        // Handle both array response and paginated response
        const usersArray = Array.isArray(response) ? response : response.pageItems || [];
        const excludedSet = new Set(EXCLUDED_USER_EMAILS.map((e) => e.toLowerCase()));
        // Map users to include displayName, filter out Mifos native/demo accounts
        this.users = usersArray
          .filter((user: any) => !excludedSet.has((user.email || '').toLowerCase()))
          .map((user: any) => ({
            ...user,
            displayName:
              user.displayName || `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || ''
          }));
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
      }
    });
  }

  create(): void {
    if (this.createForm.valid) {
      this.service.createSession(this.createForm.value).subscribe({
        next: () => {
          // Close dialog with true to signal successful creation
          // This will trigger the parent component to refresh the table
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error creating session:', error);
          // Optionally show error message to user
          // For now, just log the error - dialog stays open
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
