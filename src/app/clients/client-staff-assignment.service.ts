/** Angular Imports */
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

/** rxjs Imports */
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

/** Custom Services */
import { SKIP_ERROR_HANDLER } from 'app/core/http/http-context.tokens';
import { SettingsService } from 'app/settings/settings.service';
import { ClientsService } from './clients.service';
import {
  ClientStaffAssignment,
  CREDESAL_CLIENT_STAFF_ASSIGNMENT_DATATABLE,
  EMPTY_CLIENT_STAFF_ASSIGNMENT,
  findStaffDisplayName,
  parseClientStaffAssignment
} from './clients-view/credesal-client-staff-assignment';

export interface ClientStaffAssignmentView {
  hasRow: boolean;
  assignment: ClientStaffAssignment;
  names: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class ClientStaffAssignmentService {
  constructor(
    private clientsService: ClientsService,
    private http: HttpClient,
    private settingsService: SettingsService
  ) {}

  load(clientId: string): Observable<ClientStaffAssignmentView> {
    return this.clientsService.getClientStaffAssignment(clientId).pipe(
      switchMap(({ assignment, hasExistingRow }) =>
        this.clientsService.getActiveStaff().pipe(
          catchError(() => of([])),
          switchMap((staff) => this.resolveNames(assignment, staff || [])),
          map((names) => ({
            hasRow: hasExistingRow,
            assignment,
            names
          }))
        )
      ),
      catchError(() =>
        of({
          hasRow: false,
          assignment: { ...EMPTY_CLIENT_STAFF_ASSIGNMENT },
          names: {}
        })
      )
    );
  }

  upsertColumn(clientId: string, columnName: string, staffId: number | null): Observable<any> {
    const payload: Record<string, unknown> = {
      locale: this.settingsService.language?.code || 'en',
      dateFormat: this.settingsService.dateFormat || 'dd MMMM yyyy',
      [columnName]: staffId == null ? '' : staffId
    };
    return this.clientsService
      .getClientDatatable(clientId, CREDESAL_CLIENT_STAFF_ASSIGNMENT_DATATABLE, { skipErrorHandler: true })
      .pipe(
        switchMap((datatable: any) => {
          const parsed = parseClientStaffAssignment(datatable);
          if (parsed.hasExistingRow) {
            return this.clientsService.editClientDatatableEntry(
              clientId,
              CREDESAL_CLIENT_STAFF_ASSIGNMENT_DATATABLE,
              payload
            );
          }
          if (staffId == null) {
            return of(null);
          }
          return this.clientsService.addClientDatatableEntry(
            clientId,
            CREDESAL_CLIENT_STAFF_ASSIGNMENT_DATATABLE,
            payload
          );
        }),
        catchError((error: HttpErrorResponse) => {
          if (error?.status === 404) {
            if (staffId == null) {
              return of(null);
            }
            return this.clientsService.addClientDatatableEntry(
              clientId,
              CREDESAL_CLIENT_STAFF_ASSIGNMENT_DATATABLE,
              payload
            );
          }
          return throwError(() => error);
        })
      );
  }

  private resolveNames(
    assignment: ClientStaffAssignment,
    staffOptions: Array<{ id?: number; displayName?: string }>
  ): Observable<Record<string, string>> {
    return forkJoin({
      promoterStaffId: this.resolveStaffName(assignment.promoterStaffId, staffOptions),
      accountExecutiveStaffId: this.resolveStaffName(assignment.accountExecutiveStaffId, staffOptions),
      collectionsManagerStaffId: this.resolveStaffName(assignment.collectionsManagerStaffId, staffOptions)
    });
  }

  private resolveStaffName(
    staffId: number | null,
    staffOptions: Array<{ id?: number; displayName?: string }>
  ): Observable<string> {
    if (staffId == null) {
      return of('');
    }
    const fromList = findStaffDisplayName(staffOptions, staffId);
    if (fromList) {
      return of(fromList);
    }
    const context = new HttpContext().set(SKIP_ERROR_HANDLER, true);
    return this.http.get(`/staff/${staffId}`, { context }).pipe(
      map((staff: any) => staff?.displayName || String(staffId)),
      catchError(() => of(String(staffId)))
    );
  }
}
