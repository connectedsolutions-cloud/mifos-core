import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { CreateFlowComponent } from '../create-flow/create-flow.component';
import { LoaderComponent } from 'app/shared/loader/loader.component';
import { MatCardModule, MatCardContent } from '@angular/material/card';
import { PendientesService } from '../pendientes.service';
import { ClientsService } from 'app/clients/clients.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';
import { Observable, Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'mifosx-pendientes-dashboard',
  templateUrl: './pendientes-dashboard.component.html',
  styleUrls: ['./pendientes-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatDrawer,
    MatDrawerContainer,
    MatDrawerContent,
    LoaderComponent,
    MatCardModule,
    MatCardContent,
    FaIconComponent,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class PendientesDashboardComponent implements OnInit, OnDestroy {
  mySteps: any[] = [];
  completedSteps: any[] = [];
  viewMode: 'open' | 'closed' = 'open';
  listScope: 'assignedToMe' | 'myFlowsOthers' = 'assignedToMe';
  selectedClient: any = null;
  clientOptions: any[] = [];
  clientSearch = new UntypedFormControl('');
  loading = true;
  loadingCompleted = false;
  error: string | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private pendientesService: PendientesService,
    private clientsService: ClientsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.clientSearch.valueChanges
      .pipe(
        tap((value) => this.clearClientWhenSearchEmptied(value)),
        debounceTime(300),
        switchMap((value) => this.searchClients(value)),
        takeUntil(this.destroy$)
      )
      .subscribe((data: any) => {
        this.clientOptions = Array.isArray(data) ? data : (data?.pageItems ?? []);
      });
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayClient(client: any): string {
    return client?.displayName ?? '';
  }

  onClientSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedClient = event.option.value;
    this.reload();
  }

  clearClientFilter(): void {
    if (!this.selectedClient) {
      return;
    }
    this.selectedClient = null;
    this.clientOptions = [];
    this.clientSearch.setValue('', { emitEvent: false });
    this.reload();
  }

  clearFilters(): void {
    this.selectedClient = null;
    this.clientOptions = [];
    this.clientSearch.setValue('', { emitEvent: false });
    this.listScope = 'assignedToMe';
    this.viewMode = 'open';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.mySteps = [];
    this.requestForCurrentView().subscribe({
      next: (data: any) => {
        this.mySteps = Array.isArray(data) ? data : (data?.pageItems ?? data ?? []);
        this.loading = false;
      },
      error: (err) => {
        this.mySteps = [];
        this.error =
          err?.error?.errors?.[0]?.defaultUserMessage ||
          err.message ||
          this.translate.instant('labels.text.Error loading steps');
        this.loading = false;
      }
    });
  }

  loadCompleted(): void {
    this.loadingCompleted = true;
    this.completedSteps = [];
    this.requestForCurrentView().subscribe({
      next: (data: any) => {
        this.completedSteps = Array.isArray(data) ? data : (data?.pageItems ?? data ?? []);
        this.loadingCompleted = false;
      },
      error: () => {
        this.completedSteps = [];
        this.loadingCompleted = false;
      }
    });
  }

  setViewMode(mode: 'open' | 'closed'): void {
    if (this.viewMode === mode) {
      return;
    }
    this.viewMode = mode;
    this.reload();
  }

  setListScope(scope: 'assignedToMe' | 'myFlowsOthers'): void {
    if (this.selectedClient || this.listScope === scope) {
      return;
    }
    this.listScope = scope;
    this.reload();
  }

  get visibleCount(): number {
    return this.viewMode === 'closed' ? this.completedSteps.length : this.mySteps.length;
  }

  get completedGroups(): { date: string; dateDisplay: string; steps: any[] }[] {
    const map = new Map<string, any[]>();
    for (const step of this.completedSteps) {
      const raw = step.completionDate ?? step.creationDate;
      const dateStr = raw ? String(raw).substring(0, 10) : '';
      const key = dateStr || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(step);
    }
    return Array.from(map.entries())
      .map(
        ([
          date,
          steps
        ]) => ({
          date,
          dateDisplay: date === 'unknown' ? '' : date + 'T12:00:00.000Z',
          steps
        })
      )
      .sort((a, b) => (a.date === 'unknown' ? 1 : b.date === 'unknown' ? -1 : b.date.localeCompare(a.date)));
  }

  trackByStepId(_index: number, step: any): number {
    return step?.id ?? _index;
  }

  goToFlow(flowId: number, stepId?: number): void {
    const nav = [
      '/pendientes/flows',
      flowId
    ];
    const options = stepId != null ? { queryParams: { stepId } } : {};
    this.router.navigate(nav, options);
  }

  goToBlueprints(): void {
    this.router.navigate(['/pendientes/blueprints']);
  }

  goToCreateFlow(): void {
    const dialogRef = this.dialog.open(CreateFlowComponent, {
      width: '480px',
      autoFocus: 'first-tabbable'
    });
    dialogRef.afterClosed().subscribe((flow) => {
      if (flow?.id != null) {
        this.router.navigate([
          '/pendientes/flows',
          flow.id
        ]);
      }
    });
  }

  private reload(): void {
    if (this.viewMode === 'closed') {
      this.loadCompleted();
      return;
    }
    this.load();
  }

  private requestForCurrentView(): Observable<any> {
    const closed = this.viewMode === 'closed';
    if (this.selectedClient?.id != null) {
      return this.pendientesService.getStepsByClient(this.selectedClient.id, closed);
    }
    if (this.listScope === 'assignedToMe') {
      return closed ? this.pendientesService.getMyCompletedSteps() : this.pendientesService.getMySteps();
    }
    return closed
      ? this.pendientesService.getCompletedStepsOnMyFlowsAssignedToOthers()
      : this.pendientesService.getStepsOnMyFlowsAssignedToOthers();
  }

  private clearClientWhenSearchEmptied(value: any): void {
    if (typeof value === 'string' && value.trim() === '' && this.selectedClient) {
      this.selectedClient = null;
      this.reload();
    }
  }

  private searchClients(value: any): Observable<any> {
    if (typeof value !== 'string' || value.trim().length < 2) {
      return of([]);
    }
    return this.clientsService
      .getFilteredClients('displayName', 'ASC', false, value.trim())
      .pipe(catchError(() => of([])));
  }
}
