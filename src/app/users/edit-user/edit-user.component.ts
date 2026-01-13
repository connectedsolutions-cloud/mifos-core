/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

/** Custom Services */
import { UsersService } from '../users.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Edit User Component.
 */
@Component({
  selector: 'mifosx-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatCheckbox,
    MatIcon
  ]
})
export class EditUserComponent implements OnInit {
  /** User Data */
  userData: any;
  /** Offices Data */
  officesData: any;
  /** Staff Data */
  staffData: any;
  /** Selected Staff Details */
  selectedStaffDetails: any;
  /** Roles Data */
  rolesData: any;
  /** Edit User form. */
  editUserForm: UntypedFormGroup;

  /**
   * Retrieves the offices data from `resolve`.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {UsersService} UsersService Users Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.data.subscribe((data: { user: any; usersTemplate: any }) => {
      this.userData = data.user;
      this.officesData = data.usersTemplate.allowedOffices;
      this.rolesData = data.usersTemplate.availableRoles;
    });
  }

  ngOnInit() {
    this.createEditUserForm();
    // Initialize staff data based on first office
    const initialOfficeIds =
      this.userData.offices && this.userData.offices.length > 0
        ? this.userData.offices
        : this.userData.officeId
          ? [this.userData.officeId]
          : [];
    if (initialOfficeIds.length > 0) {
      this.officeChanged(initialOfficeIds[0]);
    }

    // Load staff details if staff is already selected
    const staffId = this.userData.staff ? this.userData.staff.id : null;
    if (staffId) {
      // Use setTimeout to ensure form is initialized first
      setTimeout(() => {
        this.loadStaffDetails(staffId);
      }, 100);
    }
  }

  /**
   * Creates the edit user form.
   */
  createEditUserForm() {
    const staffId = this.userData.staff ? this.userData.staff.id : null;
    // Get office IDs - use offices array if available, otherwise use single officeId for backward compatibility
    const officeIds =
      this.userData.offices && this.userData.offices.length > 0
        ? this.userData.offices
        : this.userData.officeId
          ? [this.userData.officeId]
          : [];

    this.editUserForm = this.formBuilder.group({
      username: [
        this.userData.username,
        Validators.required
      ],
      email: [
        this.userData.email,
        [
          Validators.required,
          Validators.email
        ]
      ],
      firstname: [
        this.userData.firstname,
        [
          Validators.required,
          Validators.pattern('(^[A-z]).*')]
      ],
      lastname: [
        this.userData.lastname,
        [
          Validators.required,
          Validators.pattern('(^[A-z]).*')]
      ],
      passwordNeverExpires: [this.userData.passwordNeverExpires],
      officeIds: [
        officeIds,
        Validators.required
      ],
      staffId: [staffId],
      roles: [
        this.userData.selectedRoles.map((role: any) => role.id),
        Validators.required
      ]
    });

    // Listen to officeIds changes for staff lookup
    this.editUserForm.get('officeIds').valueChanges.subscribe((officeIds: number[]) => {
      if (officeIds && officeIds.length > 0) {
        this.officeChanged(officeIds[0]);
      } else {
        this.staffData = [];
      }
      // Clear selected staff details when offices change
      this.selectedStaffDetails = null;
    });

    // Listen to staff selection changes to fetch staff details
    this.editUserForm.get('staffId').valueChanges.subscribe((staffId: number) => {
      if (staffId) {
        this.loadStaffDetails(staffId);
      } else {
        this.selectedStaffDetails = null;
      }
    });
  }

  /**
   * Fetches the staff for the selected office
   * @param officeId the selected office id
   */
  officeChanged(officeId: number) {
    this.staffData = [];
    this.usersService.getStaff(officeId).subscribe((staff: any) => {
      this.staffData = staff;
    });
  }

  /**
   * Loads staff details including offices for the selected staff member
   * @param staffId the selected staff id
   */
  loadStaffDetails(staffId: number) {
    this.selectedStaffDetails = null;
    this.usersService.getStaffDetails(staffId.toString()).subscribe((staffDetails: any) => {
      this.selectedStaffDetails = staffDetails;
    });
  }

  /**
   * Checks if there's an overlap between user offices and staff offices
   * @returns boolean indicating if there's a match
   */
  hasOfficeOverlap(): boolean {
    if (!this.selectedStaffDetails || !this.editUserForm) {
      return false;
    }
    const userOfficeIds = this.editUserForm.get('officeIds')?.value || [];
    const staffOfficeIds = this.selectedStaffDetails.officeIds || [];

    if (userOfficeIds.length === 0 || staffOfficeIds.length === 0) {
      return false;
    }

    return userOfficeIds.some((userOfficeId: number) => staffOfficeIds.includes(userOfficeId));
  }

  /**
   * Submits the user form and edits the user,
   * if successful redirects to the updated user.
   */
  submit() {
    const editedUser = this.editUserForm.value;
    // Convert officeIds array to the format expected by API
    if (editedUser.officeIds && Array.isArray(editedUser.officeIds)) {
      editedUser.officeIds = editedUser.officeIds.map((id: any) => id.toString());
    }
    this.usersService.editUser(this.userData.id, editedUser).subscribe((response: any) => {
      this.router.navigate(
        [
          '../../',
          response.resourceId
        ],
        { relativeTo: this.route }
      );
    });
  }
}
