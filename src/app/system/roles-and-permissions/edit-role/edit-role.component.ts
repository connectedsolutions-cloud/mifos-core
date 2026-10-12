/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

/** Custom Services */
import { SystemService } from '../../system.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { ROLE_DATA_SCOPE_OPTIONS, normalizeRoleDataScope } from 'app/core/utils/data-scope';
import { rolesFromResponse, uniqueRoleNameValidator } from '../unique-role-name.validator';

/** Custom Service Zitadel */
import { environment } from '../../../../environments/environment';
import { AuthService } from 'app/zitadel/auth.service';

/**
 * Edit Role Component.
 */
@Component({
  selector: 'mifosx-edit-role',
  templateUrl: './edit-role.component.html',
  styleUrls: ['./edit-role.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class EditRoleComponent implements OnInit {
  /** Role Form */
  roleForm: UntypedFormGroup;
  /** Role Data */
  roleData: any;
  readonly dataScopeOptions = ROLE_DATA_SCOPE_OPTIONS;

  /**
   * Retrieves the code data from `resolve`.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {SystemService} systemService System Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private systemService: SystemService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.route.data.subscribe((data: { role: any }) => {
      this.roleData = data.role;
    });
  }

  /**
   * Creates and sets the role form.
   */
  ngOnInit() {
    this.createRoleForm();
    this.systemService.getRoles().subscribe((response: unknown) => {
      this.roleForm.get('name')?.addValidators(uniqueRoleNameValidator(rolesFromResponse(response), this.roleData.id));
      this.roleForm.get('name')?.updateValueAndValidity();
    });
  }

  /**
   * Creates and sets role form.
   */
  createRoleForm() {
    this.roleForm = this.formBuilder.group({
      name: [
        this.roleData.name,
        Validators.required
      ],
      description: [
        this.roleData.description,
        Validators.required
      ],
      dataScope: [normalizeRoleDataScope(this.roleData.dataScope)]
    });
  }

  /**
   * Submits the role form and updates role name and description,
   * if successful redirects to view updated roles and permissions.
   */
  submit() {
    this.systemService.updateRole(this.roleForm.value, this.roleData.id).subscribe(() => {
      if (environment.OIDC.oidcServerEnabled) {
        this.authService.updateRole(
          this.roleData.id,
          this.roleForm.get('name')?.value,
          this.roleForm.value.description
        );
      }
      this.router.navigate(['../../'], { relativeTo: this.route });
    });
  }
}
