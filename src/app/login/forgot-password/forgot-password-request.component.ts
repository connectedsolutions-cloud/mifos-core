/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/** rxjs Imports */
import { finalize } from 'rxjs/operators';

/** Custom Services */
import { AuthenticationService } from '../../core/authentication/authentication.service';
import { MatPrefix, MatError } from '@angular/material/form-field';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Public forgot-password request form (username + tenant from the login shell).
 */
@Component({
  selector: 'mifosx-forgot-password-request',
  templateUrl: './forgot-password-request.component.html',
  styleUrls: ['./forgot-password-request.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatPrefix,
    FaIconComponent
  ]
})
export class ForgotPasswordRequestComponent implements OnInit {
  requestForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit() {
    this.requestForm = this.formBuilder.group({
      username: [
        '',
        Validators.required
      ]
    });
  }

  submit() {
    this.loading = true;
    this.requestForm.disable();
    this.authenticationService
      .requestPasswordReset(this.requestForm.value.username)
      .pipe(
        finalize(() => {
          this.requestForm.enable();
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.submitted = true;
        }
      });
  }
}
