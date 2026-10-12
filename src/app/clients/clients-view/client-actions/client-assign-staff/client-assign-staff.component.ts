/** Angular Imports */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

/** Custom Services */
import { ClientStaffAssignmentService } from 'app/clients/client-staff-assignment.service';
import { ClientsService } from 'app/clients/clients.service';
import {
  ClientStaffAssignmentRole,
  staffAssignmentRoleByAssignAction
} from 'app/clients/clients-view/credesal-client-staff-assignment';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Assign native Staff, or a Promotor / Gestor from credesal_client_staff_assignment.
 */
@Component({
  selector: 'mifosx-client-assign-staff',
  templateUrl: './client-assign-staff.component.html',
  styleUrls: ['./client-assign-staff.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    NgxMatSelectSearchModule
  ]
})
export class ClientAssignStaffComponent implements OnInit, OnDestroy {
  clientAssignStaffForm: UntypedFormGroup;
  staffData: any[] = [];
  filteredStaff: any[] = [];
  staffFilterCtrl = new UntypedFormControl('');
  clientData: any;
  role: ClientStaffAssignmentRole | undefined;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private clientsService: ClientsService,
    private clientStaffAssignmentService: ClientStaffAssignmentService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.data.subscribe((data: { clientActionData: any }) => {
      this.clientData = data.clientActionData;
    });
    const actionName = this.route.snapshot.params['name'] || this.route.parent?.snapshot.params['name'];
    this.role = staffAssignmentRoleByAssignAction(actionName);
  }

  ngOnInit() {
    this.createClientAssignStaffForm();
    this.staffData = this.clientData.staffOptions || [];
    this.filteredStaff = this.filterStaff(this.staffFilterCtrl.value);
    this.staffFilterCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.filteredStaff = this.filterStaff(this.staffFilterCtrl.value);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createClientAssignStaffForm() {
    this.clientAssignStaffForm = this.formBuilder.group({
      staffId: [
        '',
        Validators.required
      ]
    });
  }

  submit() {
    const staffId = this.clientAssignStaffForm.value.staffId;
    if (this.role) {
      this.clientStaffAssignmentService.upsertColumn(this.clientData.id, this.role.column, staffId).subscribe(() => {
        this.router.navigate(['../../'], { relativeTo: this.route });
      });
      return;
    }
    this.clientsService.executeClientCommand(this.clientData.id, 'assignStaff', { staffId }).subscribe(() => {
      this.router.navigate(['../../'], { relativeTo: this.route });
    });
  }

  private filterStaff(search: string | null): any[] {
    if (!search) {
      return this.staffData.slice();
    }
    const term = String(search).toLowerCase();
    return this.staffData.filter((staff) =>
      String(staff.displayName || '')
        .toLowerCase()
        .includes(term)
    );
  }
}
