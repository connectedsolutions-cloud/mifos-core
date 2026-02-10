import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ComiteOtorgamientoService } from '../comite-otorgamiento.service';
import { CrearPendienteTransferirFondosDialogComponent } from '../crear-pendiente-transferir-fondos-dialog/crear-pendiente-transferir-fondos-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipSet, MatChip } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../users/users.service';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { AuthenticationService } from '../../core/authentication/authentication.service';
import { LoansService } from '../../loans/loans.service';

/** Mifos native/demo emails to exclude from participants list */
const EXCLUDED_USER_EMAILS = [
  'demomfi@mifos.org',
  'email@email.com'
];

@Component({
  selector: 'mifosx-edit-sesion-comite',
  templateUrl: './edit-sesion-comite.component.html',
  styleUrls: ['./edit-sesion-comite.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipSet,
    MatChip,
    MatDialogModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class EditSesionComiteComponent implements OnInit {
  session: any;
  approvedLoansDataSource = new MatTableDataSource<any>([]);
  pendingLoansDataSource = new MatTableDataSource<any>([]);

  approvedLoansColumns = [
    'accountNo',
    'clientName',
    'principal',
    'staffName'
  ];
  finishedLoansColumns = [
    'accountNo',
    'clientName',
    'principal',
    'staffName',
    'selectedBy'
  ];
  finishedLoansDataSource = new MatTableDataSource<any>([]);
  pendingLoansColumns = [
    'select',
    'accountNo',
    'clientName',
    'principal',
    'staffName'
  ];

  sessionId: number;
  selectedLoans: Set<number> = new Set();
  unanimouslyApprovedLoanIds: Set<number> = new Set();
  users: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private service: ComiteOtorgamientoService,
    private usersService: UsersService,
    private loansService: LoansService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sessionId = +this.route.snapshot.paramMap.get('id');
    this.loadUsers();
    forkJoin({
      session: this.service.getSession(this.sessionId),
      pending: this.service.getPendingLoans()
    }).subscribe({
      next: ({ session, pending }) => {
        this.session = session;
        const raw = pending || [];
        const readyForComite = raw.filter(
          (loan: any) => loan.readyForComite === true || loan.ready_for_comite === true
        );
        this.pendingLoansDataSource.data = readyForComite;
        this.syncSelectedLoansFromSession();
        this.updateApprovedLoans();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading session or pending loans:', err);
      }
    });
  }

  loadSession(): void {
    this.service.getSession(this.sessionId).subscribe({
      next: (response: any) => {
        this.session = response;
        this.syncSelectedLoansFromSession();
        this.updateApprovedLoans();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading session:', err)
    });
  }

  loadPendingLoans(): void {
    this.service.getPendingLoans().subscribe((response: any) => {
      const raw = response || [];
      const readyForComite = raw.filter((loan: any) => loan.readyForComite === true || loan.ready_for_comite === true);
      this.pendingLoansDataSource.data = readyForComite;
    });
  }

  syncSelectedLoansFromSession(): void {
    const currentUserId = this.authenticationService.getCredentials()?.userId;
    if (!this.session?.selection || currentUserId == null) {
      return;
    }
    const ids = new Set<number>();
    for (const s of this.session.selection) {
      const uid = s.appuserId ?? s.appuser_id;
      if (uid !== currentUserId) continue;
      const lid = s.selectedId ?? s.selected_id;
      if (lid != null) ids.add(Number(lid));
    }
    this.selectedLoans = ids;
  }

  updateApprovedLoans(): void {
    const raw = this.session?.unanimouslyApprovedLoanIds;
    this.unanimouslyApprovedLoanIds = new Set(Array.isArray(raw) ? raw.map((id: number) => Number(id)) : []);
    const pending = this.pendingLoansDataSource.data || [];
    const approved = pending.filter((loan: any) => this.unanimouslyApprovedLoanIds.has(Number(loan.id)));
    // Replace data source with new instance so MatTable picks up changes
    this.approvedLoansDataSource = new MatTableDataSource<any>([...approved]);

    // Update finished loans data source if session is finished
    if (this.session?.status === 'finished') {
      this.updateFinishedLoansFromSelection();
    }
  }

  updateFinishedLoansFromSelection(): void {
    if (!this.session?.selection || !Array.isArray(this.session.selection)) {
      this.finishedLoansDataSource = new MatTableDataSource<any>([]);
      return;
    }

    // Group selections by loan ID and collect who selected each loan
    const loanSelectionsMap = new Map<number, { loanId: number; selectedByUserIds: number[] }>();
    for (const s of this.session.selection) {
      const loanId = Number(s.selectedId ?? s.selected_id);
      if (loanId == null || isNaN(loanId)) continue;

      if (!loanSelectionsMap.has(loanId)) {
        loanSelectionsMap.set(loanId, { loanId, selectedByUserIds: [] });
      }
      const userId = s.appuserId ?? s.appuser_id;
      if (userId != null) {
        loanSelectionsMap.get(loanId)!.selectedByUserIds.push(Number(userId));
      }
    }

    // Build the display data with loan details and who selected them.
    // Use explicit keys (accountNo, clientName, principal, clientStaffName) to support
    // both camelCase and snake_case from backend (LoanAccountData vs JSON).
    const pending = this.pendingLoansDataSource.data || [];
    const have: any[] = [];
    const needFetch: { loanId: number; selectedByNames: string }[] = [];

    for (const [
      loanId,
      selectionInfo
    ] of loanSelectionsMap) {
      const selectedByNames = selectionInfo.selectedByUserIds
        .map((uid) => {
          const user = this.users.find((u) => u.id === uid);
          return user?.displayName || `User ${uid}`;
        })
        .join(', ');

      const loan = pending.find((l: any) => Number(l.id) === loanId);
      if (loan) {
        have.push({
          id: loan.id ?? loanId,
          clientId: loan.clientId ?? loan.client_id,
          accountNo: loan.accountNo ?? loan.account_no ?? '-',
          clientName: loan.clientName ?? loan.client_name ?? '-',
          principal: loan.principal ?? '-',
          clientStaffName: loan.clientStaffName ?? loan.client_staff_name ?? '-',
          selectedBy: selectedByNames || '-'
        });
      } else {
        needFetch.push({ loanId, selectedByNames });
      }
    }

    if (needFetch.length === 0) {
      this.finishedLoansDataSource = new MatTableDataSource<any>([...have]);
      return;
    }

    // Fetch loan details for selection entries not in pending (e.g. session finished)
    forkJoin(
      needFetch.map(({ loanId, selectedByNames }) =>
        this.loansService.getLoanAccountDetails(String(loanId)).pipe(
          map((d: any) => ({
            id: d.id ?? loanId,
            clientId: d.clientId ?? d.client_id ?? null,
            accountNo: d.accountNo ?? d.account_no ?? '-',
            clientName: d.clientName ?? d.client_name ?? '-',
            principal: d.principal ?? '-',
            clientStaffName: d.clientStaffName ?? d.client_staff_name ?? '-',
            selectedBy: selectedByNames || '-'
          })),
          catchError(() =>
            of({
              id: loanId,
              clientId: null,
              accountNo: `Loan #${loanId}`,
              clientName: '-',
              principal: '-',
              clientStaffName: '-',
              selectedBy: selectedByNames || '-'
            })
          )
        )
      )
    ).subscribe({
      next: (fetched) => {
        this.finishedLoansDataSource = new MatTableDataSource<any>([
          ...have,
          ...fetched
        ]);
        this.cdr.detectChanges();
      },
      error: () => {
        const fallbacks = needFetch.map(({ loanId, selectedByNames }) => ({
          id: loanId,
          clientId: null as number | null,
          accountNo: `Loan #${loanId}`,
          clientName: '-',
          principal: '-',
          clientStaffName: '-',
          selectedBy: selectedByNames || '-'
        }));
        this.finishedLoansDataSource = new MatTableDataSource<any>([
          ...have,
          ...fallbacks
        ]);
        this.cdr.detectChanges();
      }
    });
  }

  isUnanimouslyApproved(loanId: number): boolean {
    return this.unanimouslyApprovedLoanIds.has(loanId);
  }

  toggleLoanSelection(loanId: number): void {
    const wasSelected = this.selectedLoans.has(loanId);
    if (wasSelected) {
      this.selectedLoans.delete(loanId);
    } else {
      this.selectedLoans.add(loanId);
    }

    const selections = Array.from(this.selectedLoans).map((id) => ({
      selected_id: id,
      selected_from_table_name: 'm_loan'
    }));

    this.service
      .updateSelections(this.sessionId, { selection: selections })
      .pipe(switchMap(() => this.service.getSession(this.sessionId, true)))
      .subscribe({
        next: (session) => {
          this.session = session;
          this.syncSelectedLoansFromSession();
          this.updateApprovedLoans();
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (wasSelected) {
            this.selectedLoans.add(loanId);
          } else {
            this.selectedLoans.delete(loanId);
          }
          console.error('Error updating selections:', err);
          this.cdr.detectChanges();
        }
      });
  }

  async startSession(): Promise<void> {
    try {
      // Start the session
      await firstValueFrom(this.service.startSession(this.sessionId));

      // Poll the session until status changes to 'started'
      const session = await this.pollSessionUntilStatusChanges('started');

      // Update session with fresh data from server
      this.session = session;
      this.syncSelectedLoansFromSession();
      this.updateApprovedLoans();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error starting session:', error);
      // Still reload session info in case of error to ensure UI is in sync
      this.loadSession();
    }
  }

  /**
   * Polls the session until the status changes to the expected status.
   * Uses exponential backoff with a maximum timeout.
   * Returns a Promise that resolves with the session when status matches.
   */
  private async pollSessionUntilStatusChanges(
    expectedStatus: string,
    maxAttempts: number = 15,
    initialDelay: number = 200
  ): Promise<any> {
    const maxDelay = 1000; // Maximum delay between attempts (1 second)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Calculate delay with exponential backoff (capped at maxDelay)
      const delay = Math.min(initialDelay * Math.pow(1.5, attempt), maxDelay);

      // Wait before polling (except on first attempt)
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        // Fetch the current session
        const session = await firstValueFrom(this.service.getSession(this.sessionId));

        // If status matches expected status, return the session
        if (session?.status === expectedStatus) {
          return session;
        }

        // If this is the last attempt, return the session anyway
        if (attempt === maxAttempts - 1) {
          console.warn(
            `Polling timeout: Status did not change to '${expectedStatus}' after ${maxAttempts} attempts. Current status: ${session?.status}`
          );
          return session;
        }
      } catch (error) {
        // If there's an error fetching the session, log it but continue polling
        console.error(`Error fetching session on attempt ${attempt + 1}:`, error);

        // If this is the last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Polling failed: Maximum attempts reached');
  }

  submitSession(): void {
    this.service.submitSession(this.sessionId).subscribe(() => {
      this.loadSession();
    });
  }

  applyApprovals(): void {
    console.debug('[COMTE-DEBUG] Apply Approvals clicked', { sessionId: this.sessionId });
    this.service.applySession(this.sessionId).subscribe({
      next: () => {
        console.debug('[COMTE-DEBUG] Apply session completed successfully', { sessionId: this.sessionId });
        this.loadSession();
      },
      error: (err) => {
        console.error('[COMTE-DEBUG] Apply session failed', { sessionId: this.sessionId, error: err });
      }
    });
  }

  openCrearPendienteTransferirFondosDialog(): void {
    const dialogRef = this.dialog.open(CrearPendienteTransferirFondosDialogComponent, {
      width: '500px',
      data: { sessionId: this.sessionId }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSession();
      }
    });
  }

  isLoanSelected(loanId: number): boolean {
    return this.selectedLoans.has(loanId);
  }

  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (response: any) => {
        // Handle both array response and paginated response
        const usersArray = Array.isArray(response) ? response : response.pageItems || [];
        const excludedSet = new Set(EXCLUDED_USER_EMAILS.map((e) => e.toLowerCase()));
        // Map users to include displayName, filter out Mifos native/demo accounts
        this.users = usersArray
          .filter((user: any) => !excludedSet.has((user.email || '').toLowerCase()))
          .map((user: any) => ({
            ...user,
            displayName:
              user.displayName || `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || ''
          }));
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
      }
    });
  }

  onParticipantsChange(selectedParticipantIds: number[]): void {
    if (this.isParticipantsEditable()) {
      this.service.updateSession(this.sessionId, { integrantes: selectedParticipantIds }).subscribe({
        next: () => {
          this.loadSession();
        },
        error: (error) => {
          console.error('Error updating participants:', error);
        }
      });
    }
  }

  isParticipantsEditable(): boolean {
    if (!this.session) {
      return false;
    }
    const status = this.session.status;
    // Only editable when status is "created"
    // Locked when status is "started", "closed", "applied", or "finished"
    return status === 'created';
  }

  onSessionNameChange(): void {
    if (this.session && this.session.status === 'created') {
      this.service.updateSession(this.sessionId, { name: this.session.name }).subscribe({
        next: () => {
          // Optionally reload session to get updated data from server
          // this.loadSession();
        },
        error: (error) => {
          console.error('Error updating session name:', error);
          // Reload session to revert to original name on error
          this.loadSession();
        }
      });
    }
  }

  openLoanDetails(loan: any): void {
    if (loan && loan.clientId && loan.id) {
      const url = `/#/clients/${loan.clientId}/loans-accounts/${loan.id}/general`;
      window.open(url, '_blank');
    }
  }
}
