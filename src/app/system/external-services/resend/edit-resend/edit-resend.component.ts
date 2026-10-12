/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

/** Custom Services */
import { SystemService } from 'app/system/system.service';
import { MatIconButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Edit Resend Configuration Component.
 */
@Component({
  selector: 'mifosx-edit-resend',
  templateUrl: './edit-resend.component.html',
  styleUrls: ['./edit-resend.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatIconButton,
    FaIconComponent
  ]
})
export class EditResendComponent implements OnInit {
  /** API key input field type. */
  apiKeyInputType: string;
  /** Resend Configuration data */
  resendConfigurationData: { name: string; value: string }[];
  /** Resend Configuration Form */
  resendConfigurationForm: UntypedFormGroup;

  /**
   * Retrieves the Resend configuration data from `resolve`.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {SystemService} systemService System Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private systemService: SystemService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.data.subscribe((data: { resendConfiguration: { name: string; value: string }[] }) => {
      this.resendConfigurationData = data.resendConfiguration;
    });
  }

  /**
   * Creates Resend configuration form.
   */
  ngOnInit() {
    this.setResendConfigurationForm();
    this.apiKeyInputType = 'password';
  }

  /**
   * Creates Resend configuration form mapped by property name.
   */
  setResendConfigurationForm() {
    this.resendConfigurationForm = this.formBuilder.group({
      apiKey: [
        this.valueOf('apiKey'),
        Validators.required
      ],
      fromEmail: [
        this.valueOf('fromEmail'),
        Validators.required
      ],
      fromName: [
        this.valueOf('fromName'),
        Validators.required
      ]
    });
  }

  /**
   * Submits the Resend configuration and updates it,
   * if successful redirects to view Resend configuration.
   */
  submit() {
    this.systemService.updateExternalConfiguration('RESEND', this.resendConfigurationForm.value).subscribe(() => {
      this.router.navigate(['../'], { relativeTo: this.route });
    });
  }

  private valueOf(name: string): string {
    const row = this.resendConfigurationData?.find((item) => item.name === name);
    return row?.value ?? '';
  }
}
