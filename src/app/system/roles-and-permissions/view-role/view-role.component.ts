/** Angular Imports  */
import { Component, OnInit, ViewChildren, QueryList, ElementRef, ChangeDetectorRef } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { SystemService } from '../../system.service';

/** Custom Components */
import { TranslateService } from '@ngx-translate/core';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { DisableDialogComponent } from '../../../shared/disable-dialog/disable-dialog.component';
import { EnableDialogComponent } from '../../../shared/enable-dialog/enable-dialog.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';
import { MatList, MatListItem } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatIcon } from '@angular/material/icon';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** RxJS Imports */
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

/** Custom Service Zitadel */
import { environment } from '../../../../environments/environment';
import { AuthService } from 'app/zitadel/auth.service';

/**
 * Permission option interface for search
 */
interface PermissionOption {
  code: string;
  displayName: string;
  grouping: string;
  id: number;
}

/**
 * View Role and Permissions Component
 */
@Component({
  selector: 'mifosx-view-role',
  templateUrl: './view-role.component.html',
  styleUrls: ['./view-role.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    MatList,
    MatListItem,
    NgClass,
    MatDivider,
    MatCheckbox,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatIcon,
    AsyncPipe
  ]
})
export class ViewRoleComponent implements OnInit {
  /** Role Permissions Data */
  rolePermissionService: any;
  /** Stores the current grouping */
  currentGrouping: string;
  /** Stores the previous grouping */
  previousGrouping = '';
  /** Stores Grouping Data */
  groupings: string[] = [];
  /** Stores the selected role */
  selectedItem = '';
  /** Checks if its disabled */
  isDisabled: Boolean = true;
  /** Checks if there is any change in data */
  checkboxesChanged: Boolean = false;
  /** Stores backup values */
  bValuesOnly: string[] = [];
  /** Role ID */
  roleId: any;
  /** Creates permission form  */
  formGroup: UntypedFormGroup;
  /** Creates Backup form */
  backupform: UntypedFormGroup;
  /** Temporarily stores Permission data */
  tempPermissionUIData: {
    [key: string]: {
      permissions: { code: string; id: number; selected?: boolean }[];
    };
  } = {};
  /** Stores permissions */
  permissions: {
    permissions: { code: string; id: number }[];
  } = { permissions: [] };
  /** Add role zitadel */

  /** Permission search form control */
  permissionSearchControl: UntypedFormControl = new UntypedFormControl();
  /** Filtered permissions for autocomplete */
  filteredPermissions: Observable<PermissionOption[]>;
  /** Flat list of all permissions */
  allPermissions: PermissionOption[] = [];
  /** Currently highlighted permission code */
  highlightedPermissionCode: string | null = null;
  /** ViewChildren reference for permission elements */
  @ViewChildren('permissionElement') permissionElements: QueryList<ElementRef>;

  /**
   * Retrieves the roledetails data from `resolve`.
   * @param {ActivatedRoute} route Activated Route.
   * @param {SystemService} systemService System Service.
   * @param {Router} router Router for navigation.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {MatDialog} dialog Shared Dialog Boxes.
   * @param {TranslateService} translateService Translate Service.
   */
  constructor(
    private route: ActivatedRoute,
    private systemService: SystemService,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private translateService: TranslateService,
    public dialog: MatDialog,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.route.data.subscribe((data: { roledetails: any }) => {
      this.rolePermissionService = data.roledetails;
    });
  }

  /**
   * Groups all the data on init
   */
  ngOnInit() {
    this.permissions = {
      permissions: []
    };
    this.createForm();
    this.groupRules();
    this.initializePermissionSearch();
    this.filterPermissions();
    this.selectedItem = 'special';
    this.showPermissions('special');
    this.route.params.subscribe((routeParams: any) => {
      this.roleId = routeParams.id;
    });
  }

  /**
   * creates the form to display and edit permissions
   */
  createForm() {
    this.formGroup = this.formBuilder.group({
      roster: this.formBuilder.array(
        this.rolePermissionService.permissionUsageData.map((elem: any) => this.createMemberGroup(elem))
      )
    });
  }

  createMemberGroup(permission: any): UntypedFormGroup {
    return this.formBuilder.group({
      ...permission,
      ...{
        code: [
          permission.code,
          Validators.required
        ],
        selected: [
          { value: permission.selected, disabled: true },
          Validators.required
        ]
      }
    });
  }

  /**
   * Groups the permissions based on rules
   */
  groupRules() {
    this.tempPermissionUIData = {};
    for (const i in this.rolePermissionService.permissionUsageData) {
      if (this.rolePermissionService.permissionUsageData[i]) {
        if (this.rolePermissionService.permissionUsageData[i].grouping !== this.currentGrouping) {
          this.currentGrouping = this.rolePermissionService.permissionUsageData[i].grouping;
          this.groupings.push(this.currentGrouping);
          this.tempPermissionUIData[this.currentGrouping] = { permissions: [] };
        }
        const temp = {
          code: this.rolePermissionService.permissionUsageData[i].code,
          id: +i,
          selected: this.rolePermissionService.permissionUsageData[i].selected
        };
        this.tempPermissionUIData[this.currentGrouping].permissions.push(temp);
      }
    }
  }

  /**
   * Displays the permission for selected role
   * @param grouping Selected Role
   */
  showPermissions(grouping: string) {
    this.permissions = this.tempPermissionUIData[grouping];
    this.selectedItem = grouping;
    this.previousGrouping = grouping;
  }

  /**
   * Formats the Role Name
   * @param string String
   */
  formatName(string: any) {
    if (string.indexOf('portfolio_') > -1) {
      string = string.replace('portfolio_', '');
    }
    if (string.indexOf('transaction_') > -1) {
      const temp = string.split('_');
      string = temp[1] + ' ' + temp[0].charAt(0).toUpperCase() + temp[0].slice(1) + 's';
    }
    string = string.charAt(0).toUpperCase() + string.slice(1);
    return string;
  }

  /**
   * Formats the permission from permission code
   * @param name String
   */
  permissionName(name: any) {
    name = name || '';
    // replace '_' with ' '
    name = name.replace(/_/g, ' ');
    // for reports replace read with view
    if (this.previousGrouping === 'report') {
      name = name.replace(/READ/g, 'View');
    }
    return name;
  }

  /**
   * Formats the permission name with a specific grouping
   * @param name Permission code
   * @param grouping Grouping name
   * @returns Formatted permission name
   */
  private formatPermissionName(name: any, grouping: string): string {
    name = name || '';
    // replace '_' with ' '
    name = name.replace(/_/g, ' ');
    // for reports replace read with view
    if (grouping === 'report') {
      name = name.replace(/READ/g, 'View');
    }
    return name;
  }

  /**
   * Initializes the permission search by building flat list from tempPermissionUIData
   */
  private initializePermissionSearch(): void {
    this.allPermissions = [];
    Object.keys(this.tempPermissionUIData).forEach((grouping) => {
      this.tempPermissionUIData[grouping].permissions.forEach((permission) => {
        this.allPermissions.push({
          code: permission.code,
          displayName: this.formatPermissionName(permission.code, grouping),
          grouping: grouping,
          id: permission.id
        });
      });
    });
  }

  /**
   * Fuzzy match algorithm - matches characters in order but not necessarily consecutively
   * @param searchTerm Search term
   * @param text Text to search in
   * @returns boolean indicating if there's a match
   */
  private fuzzyMatch(searchTerm: string, text: string): boolean {
    const search = searchTerm.toLowerCase().replace(/\s+/g, '');
    const target = text.toLowerCase().replace(/\s+/g, '');

    // Simple fuzzy match: all characters in search must appear in order in target
    let searchIndex = 0;
    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
      if (target[i] === search[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === search.length;
  }

  /**
   * Filters permissions based on search input with fuzzy matching
   */
  private filterPermissions(): void {
    this.filteredPermissions = this.permissionSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged(),
      map((value) => {
        const searchValue = (value || '').toString().toLowerCase();
        if (!searchValue) {
          return this.allPermissions.slice(0, 20); // Limit to 20 results
        }
        return this.allPermissions
          .filter(
            (permission) =>
              this.fuzzyMatch(searchValue, permission.displayName) ||
              this.fuzzyMatch(searchValue, permission.code) ||
              this.fuzzyMatch(searchValue, this.formatName(permission.grouping))
          )
          .slice(0, 20); // Limit results
      })
    );
  }

  /**
   * Displays permission name in autocomplete
   * @param permission Permission option
   * @returns Display string
   */
  displayPermission(permission: PermissionOption): string {
    return permission ? permission.displayName : '';
  }

  /**
   * Handles permission selection from autocomplete
   * @param permission Selected permission option
   */
  onPermissionSelected(permission: PermissionOption): void {
    if (!permission) {
      return;
    }
    // Select the category
    this.showPermissions(permission.grouping);
    this.highlightedPermissionCode = permission.code;

    // Clear search
    this.permissionSearchControl.setValue('');

    // Wait for DOM update, then scroll and highlight
    setTimeout(() => {
      this.scrollToPermission(permission.code);
    }, 100);
  }

  /**
   * Scrolls to the selected permission and highlights it
   * @param code Permission code
   */
  private scrollToPermission(code: string): void {
    if (!this.permissionElements) {
      return;
    }

    const element = this.permissionElements.find((el) => el.nativeElement.querySelector(`[id="${code}"]`));

    if (element) {
      element.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Remove highlight after 3 seconds
      setTimeout(() => {
        this.highlightedPermissionCode = null;
      }, 3000);
    }
  }

  /**
   * Backups the values
   */
  backupCheckValues() {
    this.backupform = _.cloneDeep(this.formGroup) as UntypedFormGroup;
  }

  /**
   * Restores the checkboxes to previous data on clicking cancel
   */
  restoreCheckboxes() {
    this.formGroup = _.cloneDeep(this.backupform) as UntypedFormGroup;
  }

  isRoleEnable(value: any) {
    return value;
  }

  editRoles() {
    this.isDisabled = false;
    this.formGroup.controls.roster.enable();
  }

  /**
   * Cancel the changes
   */
  cancel() {
    this.isDisabled = true;
    this.formGroup.controls.roster.disable();
  }

  /**
   * Submits the modified permissions
   */
  submit() {
    const value = this.formGroup.get('roster').value;
    const data: { [key: string]: boolean } = {};
    const permissionData = {
      permissions: {}
    };
    for (let i = 0; i < value.length; i++) {
      data[value[i].code] = value[i].selected;
    }
    permissionData.permissions = data;
    this.formGroup.controls.roster.disable();
    this.checkboxesChanged = false;
    this.isDisabled = true;
    this.systemService.updateRolePermission(this.roleId, permissionData).subscribe((response: any) => {});
  }

  /**
   * Selects all the permission of a particular role
   */
  selectAll() {
    const roster = this.formGroup.get('roster') as FormArray;
    for (let i = 0; i < this.permissions.permissions.length; i++) {
      roster.at(this.permissions.permissions[i].id).patchValue({
        selected: true
      });
    }
  }

  /**
   * Deselects all the permissions of a particular role
   */
  deselectAll() {
    const roster = this.formGroup.get('roster') as FormArray;
    for (let i = 0; i < this.permissions.permissions.length; i++) {
      roster.at(this.permissions.permissions[i].id).patchValue({
        selected: false
      });
    }
  }

  /**
   * Deletes the Role and redirects to Roles and Permissions.
   */
  deleteRole() {
    const deleteRoleDialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: this.translateService.instant('labels.inputs.Role') + ' ' + this.roleId }
    });
    deleteRoleDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.systemService.deleteRole(this.roleId).subscribe(() => {
          if (environment.OIDC.oidcServerEnabled) {
            this.authService.deleteRole(this.roleId);
          }
          this.router.navigate(['/system/roles-and-permissions']);
        });
      } else {
      }
    });
  }

  /**
   * Enables the Role and redirects to Roles and Permissions.
   */
  enableRolesConfirmation() {
    const enableRoleDialogRef = this.dialog.open(EnableDialogComponent, {
      data: { enableContext: this.translateService.instant('labels.inputs.Role') + ' ' + this.roleId }
    });
    enableRoleDialogRef.afterClosed().subscribe((response: any) => {
      if (response.enable) {
        this.systemService.enableRole(this.roleId).subscribe(() => {
          this.router.navigate(['/system/roles-and-permissions']);
        });
      } else {
      }
    });
  }

  /**
   * Disables the Role and redirects to Roles and Permissions.
   */
  disableRolesConfirmation() {
    const deleteRoleDialogRef = this.dialog.open(DisableDialogComponent, {
      data: { disableContext: this.translateService.instant('labels.inputs.Role') + ' ' + this.roleId }
    });
    deleteRoleDialogRef.afterClosed().subscribe((response: any) => {
      if (response.disable) {
        this.systemService.disableRole(this.roleId).subscribe(() => {
          this.router.navigate(['/system/roles-and-permissions']);
        });
      } else {
      }
    });
  }
}
