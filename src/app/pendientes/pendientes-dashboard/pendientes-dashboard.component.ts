import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule, MatCardContent } from '@angular/material/card';
import { PendientesService } from '../pendientes.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';

@Component({
  selector: 'mifosx-pendientes-dashboard',
  templateUrl: './pendientes-dashboard.component.html',
  styleUrls: ['./pendientes-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatCardContent,
    FaIconComponent,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class PendientesDashboardComponent implements OnInit {
  mySteps: any[] = [];
  completedSteps: any[] = [];
  viewMode: 'open' | 'closed' = 'open';
  loading = true;
  loadingCompleted = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private pendientesService: PendientesService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.pendientesService.getMySteps().subscribe({
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
    this.pendientesService.getMyCompletedSteps().subscribe({
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

  showClosedView(): void {
    this.viewMode = 'closed';
    this.loadCompleted();
  }

  showOpenView(): void {
    this.viewMode = 'open';
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
    this.router.navigate(['/pendientes/flows/create']);
  }
}
