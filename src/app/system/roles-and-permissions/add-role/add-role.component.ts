/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/** Custom Services */
import { SystemService } from '../../system.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { TranslateService } from '@ngx-translate/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  RolePermissionJsonError,
  buildRolePermissionUpdateBody,
  parseRolePermissionJson,
  permissionCodesFromRole,
  splitKnownPermissions
} from '../role-permission-json';
import { ROLE_DATA_SCOPE_OPTIONS, normalizeRoleDataScope } from 'app/core/utils/data-scope';
import { rolesFromResponse, uniqueRoleNameValidator } from '../unique-role-name.validator';

/** Custom Service Zitadel */
import { environment } from '../../../../environments/environment';
import { AuthService } from 'app/zitadel/auth.service';

/**
 * Add Role Component.
 */
@Component({
  selector: 'mifosx-add-role',
  templateUrl: './add-role.component.html',
  styleUrls: ['./add-role.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent
  ]
})
export class AddRoleComponent implements OnInit {
  /** Role form. */
  roleForm: UntypedFormGroup;
  /** Permission codes loaded from a JSON file. */
  importedPermissionCodes: string[] = [];
  readonly dataScopeOptions = ROLE_DATA_SCOPE_OPTIONS;

  /**
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
    private authService: AuthService,
    private translateService: TranslateService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Creates the role form.
   */
  ngOnInit() {
    this.createRoleForm();
    this.systemService.getRoles().subscribe((response: unknown) => {
      this.roleForm.get('name')?.addValidators(uniqueRoleNameValidator(rolesFromResponse(response)));
      this.roleForm.get('name')?.updateValueAndValidity();
    });
  }

  /**
   * Creates the create role form.
   */
  createRoleForm() {
    this.roleForm = this.formBuilder.group({
      name: [
        '',
        Validators.required
      ],
      description: [
        '',
        Validators.required
      ],
      dataScope: ['ALL']
    });
  }

  /**
   * Loads name, description, and permission codes from a JSON file.
   */
  onImportRoleJson(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseRolePermissionJson(String(reader.result || ''));
        this.roleForm.patchValue({
          name: parsed.name || this.roleForm.value.name,
          description: parsed.description || this.roleForm.value.description,
          dataScope: parsed.dataScope ? normalizeRoleDataScope(parsed.dataScope) : this.roleForm.value.dataScope
        });
        this.importedPermissionCodes = parsed.permissions;
        this.snackBar.open(
          this.translateService.instant('labels.text.Permissions loaded', {
            count: parsed.permissions.length
          }),
          'Close',
          { duration: 4000 }
        );
      } catch (error) {
        this.importedPermissionCodes = [];
        const message =
          error instanceof RolePermissionJsonError
            ? error.message
            : this.translateService.instant('labels.text.Invalid role permission JSON');
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    };
    reader.readAsText(file);
  }

  /**
   * Submits the role form and creates a role,
   * if successful redirects back to roles and permission.
   */
  submit() {
    const rolePayload = {
      name: this.roleForm.value.name,
      description: this.roleForm.value.description,
      dataScope: this.roleForm.value.dataScope || 'ALL'
    };
    this.systemService
      .createRole(rolePayload)
      .pipe(
        switchMap((response: any) => {
          const roleId = response.resourceId ?? response.resourceId;
          if (environment.OIDC.oidcServerEnabled) {
            this.authService.createRole(roleId, rolePayload.name, rolePayload.description);
          }
          if (!this.importedPermissionCodes.length) {
            return of({ unknown: [] as string[], applied: 0 });
          }
          return this.systemService.getRole(roleId).pipe(
            switchMap((role: any) => {
              const catalog = permissionCodesFromRole(role);
              const { known, unknown } = splitKnownPermissions(this.importedPermissionCodes, catalog);
              if (!known.length) {
                return of({ unknown, applied: 0 });
              }
              return this.systemService
                .updateRolePermission(roleId, buildRolePermissionUpdateBody(known))
                .pipe(switchMap(() => of({ unknown, applied: known.length })));
            })
          );
        })
      )
      .subscribe((result: { unknown: string[]; applied: number }) => {
        if (this.importedPermissionCodes.length) {
          this.showImportResult(result.applied, result.unknown);
        }
        this.router.navigate(['../'], { relativeTo: this.route });
      });
  }

  private showImportResult(applied: number, unknown: string[]): void {
    if (unknown.length) {
      this.snackBar.open(
        this.translateService.instant('labels.text.Applied permissions skipped unknown', {
          applied,
          count: unknown.length,
          codes: unknown.join(', ')
        }),
        'Close',
        { duration: 8000 }
      );
      return;
    }
    this.snackBar.open(this.translateService.instant('labels.text.Applied permissions', { applied }), 'Close', {
      duration: 4000
    });
  }
}
