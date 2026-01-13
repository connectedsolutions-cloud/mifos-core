/** Angular Imports */
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

/** Custom Services */
import { UsersService } from '../users.service';

/** Custom Components */
import { DeleteDialogComponent } from 'app/shared/delete-dialog/delete-dialog.component';
import { ChangePasswordDialogComponent } from 'app/shared/change-password-dialog/change-password-dialog.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * View user component.
 */
@Component({
  selector: 'mifosx-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
  standalone: true,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent
  ]
})
export class ViewUserComponent {
  /** User Data. */
  userData: any;
  /** Office Names Array */
  officeNames: string[] = [];

  /**
   * Retrieves the user data from `resolve`.
   * @param {UsersService} usersService Users Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   * @param {MatDialog} dialog Dialog reference.
   * @param {HttpClient} http Http Client to fetch offices.
   */
  constructor(
    private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private http: HttpClient
  ) {
    this.route.data.subscribe((data: { user: any }) => {
      this.userData = data.user;
      this.loadOfficeNames();
    });
  }

  /**
   * Loads office names based on office IDs
   */
  loadOfficeNames() {
    // Get office IDs from userData (could be 'offices' array or single 'officeId')
    const officeIds =
      this.userData.offices && this.userData.offices.length > 0
        ? this.userData.offices
        : this.userData.officeId
          ? [this.userData.officeId]
          : [];

    if (officeIds.length > 0) {
      // Fetch all offices and map IDs to names
      this.http.get('/offices').subscribe((offices: any) => {
        const officesMap = new Map();
        offices.forEach((office: any) => {
          officesMap.set(office.id, office.name);
        });

        // Map office IDs to names
        this.officeNames = officeIds
          .map((id: number) => officesMap.get(id))
          .filter((name: string) => name !== undefined);

        // Fallback: if no names found, use officeName if available
        if (this.officeNames.length === 0 && this.userData.officeName) {
          this.officeNames = [this.userData.officeName];
        }
      });
    } else if (this.userData.officeName) {
      // Fallback to single officeName if no office IDs
      this.officeNames = [this.userData.officeName];
    }
  }

  /**
   * Deletes the user and redirects to users.
   */
  delete() {
    const deleteUserDialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: `user ${this.userData.id}` }
    });
    deleteUserDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.usersService.deleteUser(this.userData.id).subscribe(() => {
          this.router.navigate(['/appusers']);
        });
      }
    });
  }

  /**
   * Change Password of the Users.
   */
  changeUserPassword() {
    const changeUserPasswordDialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '440px'
    });
    changeUserPasswordDialogRef.afterClosed().subscribe((response: any) => {
      if (response.password && response.repeatPassword) {
        const password = response.password;
        const repeatPassword = response.repeatPassword;
        const firstname = this.userData.firstname;
        const data = { password: password, repeatPassword: repeatPassword, firstname: firstname };
        this.usersService.changePassword(this.userData.id, data).subscribe(() => {
          this.router.navigate(['/appusers']);
        });
      }
    });
  }
}
