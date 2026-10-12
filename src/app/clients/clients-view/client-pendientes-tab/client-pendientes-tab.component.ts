import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { PendientesService } from '../../../pendientes/pendientes.service';
import { STANDALONE_SHARED_IMPORTS } from '../../../standalone-shared.module';
import { ClientPendientesRefreshService } from '../client-pendientes-refresh.service';

@Component({
  selector: 'mifosx-client-pendientes-tab',
  templateUrl: './client-pendientes-tab.component.html',
  styleUrls: ['./client-pendientes-tab.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTableModule
  ]
})
export class ClientPendientesTabComponent implements OnInit, OnDestroy {
  clientId: number;
  steps: any[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns = [
    'note',
    'responsable',
    'dueDate',
    'status',
    'created'
  ];
  private refreshSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pendientesService: PendientesService,
    private clientPendientesRefreshService: ClientPendientesRefreshService
  ) {
    this.clientId = Number(this.route.parent.snapshot.params['clientId']);
  }

  ngOnInit(): void {
    this.load();
    this.refreshSubscription = this.clientPendientesRefreshService.refreshed$.subscribe((clientId) => {
      if (Number(clientId) === this.clientId) {
        this.load();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.pendientesService.getStepsByClient(this.clientId).subscribe({
      next: (steps) => {
        this.steps = Array.isArray(steps) ? steps : [];
        this.loading = false;
      },
      error: () => {
        this.steps = [];
        this.loading = false;
        this.error = 'Error loading steps';
      }
    });
  }

  noteText(step: any): string {
    return step?.note || step?.description || '';
  }

  statusKey(status: string): string {
    switch (status) {
      case 'open':
        return 'labels.text.Pending step open';
      case 'pending':
        return 'labels.text.Pending step pending';
      case 'blocked':
        return 'labels.text.Pending step blocked';
      case 'completed':
        return 'labels.text.Pending step completed';
      case 'cancelado':
        return 'labels.text.Pending step cancelled';
      default:
        return '';
    }
  }

  openFlow(step: any): void {
    if (step?.pendingFlowId == null) {
      return;
    }
    this.router.navigate([
      '/pendientes/flows',
      step.pendingFlowId
    ]);
  }
}
