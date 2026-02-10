import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PendientesService } from '../pendientes.service';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';

@Component({
  selector: 'mifosx-flow-detail',
  templateUrl: './flow-detail.component.html',
  styleUrls: ['./flow-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class FlowDetailComponent implements OnInit {
  flow: any;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pendientesService: PendientesService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pendientesService.getFlow(+id, true).subscribe({
        next: (data) => {
          this.flow = data;
          this.loading = false;
        },
        error: (err) => {
          this.error =
            err?.error?.errors?.[0]?.defaultUserMessage ||
            err.message ||
            this.translate.instant('labels.text.Error loading flow');
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  completeStep(step: any): void {
    this.pendientesService.completeStep(step.id).subscribe({
      next: () => this.ngOnInit(),
      error: (err) => {
        this.error =
          err?.error?.errors?.[0]?.defaultUserMessage ||
          err.message ||
          this.translate.instant('labels.text.Error completing step');
      }
    });
  }

  canComplete(step: any): boolean {
    if (step.status === 'completed') return false;
    if (!step.previousStepId) return true;
    const prev = this.flow?.steps?.find((s: any) => s.id === step.previousStepId);
    return prev?.status === 'completed';
  }

  back(): void {
    this.router.navigate(['/pendientes']);
  }
}
