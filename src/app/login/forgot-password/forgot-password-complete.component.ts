/** Angular Imports */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

/** rxjs Imports */
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Custom Services */
import { AuthenticationService } from '../../core/authentication/authentication.service';
import { AlertService } from '../../core/alert/alert.service';
import { SettingsService } from 'app/settings/settings.service';
import { confirmPasswordValidator } from '../reset-password/confirm-password.validator';
import { PasswordsUtility } from 'app/core/utils/passwords-utility';
import { TranslateService } from '@ngx-translate/core';
import { MatDivider } from '@angular/material/divider';
import { MatPrefix } from '@angular/material/form-field';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatIconButton } from '@angular/material/button';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Public magic-link password reset completion form.
 */
@Component({
  selector: 'mifosx-forgot-password-complete',
  templateUrl: './forgot-password-complete.component.html',
  styleUrls: ['./forgot-password-complete.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDivider,
    MatPrefix,
    FaIconComponent,
    MatIconButton
  ]
})
export class ForgotPasswordCompleteComponent implements OnInit, OnDestroy {
  resetPasswordForm: UntypedFormGroup;
  passwordInputType = 'password';
  loading = false;
  token: string | null = null;
  invalidLink = false;
  private queryParamsSub: Subscription;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authenticationService: AuthenticationService,
    private passwordsUtility: PasswordsUtility,
    private route: ActivatedRoute,
    private router: Router,
    private settingsService: SettingsService,
    private alertService: AlertService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.resetPasswordForm = this.formBuilder.group(
      {
        password: [
          '',
          this.passwordsUtility.getPasswordValidators()
        ],
        repeatPassword: [
          '',
          Validators.required
        ]
      },
      { validator: confirmPasswordValidator }
    );
    this.queryParamsSub = this.route.queryParamMap.subscribe((params) => {
      const tenant = params.get('tenant');
      if (tenant) {
        this.settingsService.setTenantIdentifier(tenant);
      }
      this.token = params.get('token');
      this.invalidLink = !this.token;
    });
  }

  ngOnDestroy() {
    this.queryParamsSub?.unsubscribe();
  }

  submit() {
    if (!this.token) {
      this.invalidLink = true;
      return;
    }
    this.loading = true;
    this.resetPasswordForm.disable();
    this.authenticationService
      .completePasswordReset(
        this.token,
        this.resetPasswordForm.value.password,
        this.resetPasswordForm.value.repeatPassword
      )
      .pipe(
        finalize(() => {
          this.resetPasswordForm.enable();
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.alertService.alert({
            type: 'Password Reset Success',
            message: this.translate.instant('labels.text.Your password has been reset. You can now sign in.')
          });
          this.router.navigate(['/login'], { replaceUrl: true });
        },
        error: (err: HttpErrorResponse) => {
          if (err?.status === 403) {
            this.invalidLink = true;
          }
        }
      });
  }
}
