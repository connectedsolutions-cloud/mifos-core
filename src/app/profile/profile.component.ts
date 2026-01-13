/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';

/** Custom Services */
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { ChangePasswordDialogComponent } from 'app/shared/change-password-dialog/change-password-dialog.component';
import { SettingsService } from 'app/settings/settings.service';
import { UsersService } from 'app/users/users.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Profile Component.
 */
@Component({
  selector: 'mifosx-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow
  ]
})
export class ProfileComponent implements OnInit {
  /** Profile Data */
  profileData: any;
  /** User Data with offices */
  userData: any;
  /** Available offices for the user */
  availableOffices: any[] = [];
  /** Language, TODO: Update when df, locale settings are setup */
  language = 'English';

  /** Roles Table Datasource */
  dataSource = new MatTableDataSource();
  /** Columns to be displayed in user roles table. */
  displayedColumns: string[] = [
    'role',
    'description'
  ];

  /**
   * @param {AuthenticationService} authenticationService Authentication Service
   * @param {UsersService} usersService Users Service
   * @param {SettingsService} settingsService Settings Service
   * @param {Router} router Router
   * @param {MatDialog} dialog Mat Dialog
   */
  constructor(
    private authenticationService: AuthenticationService,
    private usersService: UsersService,
    private settingsService: SettingsService,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.profileData = authenticationService.getCredentials();
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.profileData.roles);
    // Fetch full user data to get offices array
    this.usersService.getUser(this.profileData.userId.toString()).subscribe((user: any) => {
      this.userData = user;
      // Get available offices - use offices array if available, otherwise use single officeId
      if (user.offices && user.offices.length > 0) {
        this.availableOffices = user.offices.map((officeId: number) => {
          // Find office name from allowedOffices if available
          const office = user.allowedOffices?.find((o: any) => o.id === officeId);
          return {
            id: officeId,
            name: office ? office.name : `Office ${officeId}`
          };
        });
        // Set current office ID from user data
        if (user.currentOfficeId) {
          this.profileData.officeId = user.currentOfficeId;
          const currentOffice = this.availableOffices.find((o: any) => o.id === user.currentOfficeId);
          if (currentOffice) {
            this.profileData.officeName = currentOffice.name;
          }
        }
      } else if (user.officeId) {
        this.availableOffices = [
          {
            id: user.officeId,
            name: user.officeName
          }
        ];
      }
    });
  }

  /**
   * Switch current office context
   */
  switchOffice(officeId: number) {
    this.usersService.switchOffice(this.profileData.userId.toString(), officeId).subscribe(() => {
      // Refresh user data and credentials
      this.usersService.getUser(this.profileData.userId.toString()).subscribe((user: any) => {
        this.userData = user;
        // Update profileData with new office info
        this.profileData.officeId = user.currentOfficeId || user.officeId;
        this.profileData.officeName = user.officeName;
        // Reload page to refresh all data with new office context
        window.location.reload();
      });
    });
  }

  /**
   * Change Password of the user.
   */
  changeUserPassword() {
    const changeUserPasswordDialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      height: '300px'
    });
    changeUserPasswordDialogRef.afterClosed().subscribe((response: any) => {
      if (response.password && response.repeatPassword) {
        const password = response.password;
        const repeatPassword = response.repeatPassword;
        const data = { password: password, repeatPassword: repeatPassword };
        this.authenticationService.changePassword(this.profileData.userId, data).subscribe(() => {
          this.router.navigate(['/home']);
        });
      }
    });
  }

  get tenantIdentifier(): string {
    return this.settingsService.tenantIdentifier || 'default';
  }
}
