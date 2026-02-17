import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PendientesService } from '../pendientes.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import {
  CompleteStepNextDialogComponent,
  CompleteStepNextDialogData
} from '../complete-step-next-dialog/complete-step-next-dialog.component';
import { AuthenticationService } from '../../core/authentication/authentication.service';
import { ComiteOtorgamientoService } from '../../comite-otorgamiento/comite-otorgamiento.service';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';
import { getBlockComponent } from './step-blocks/block-registry';

/** Step name -> list of detail blocks (key + i18n label key) to show in the step card. */
const STEP_DETAIL_BLOCKS: Record<string, Array<{ key: string; labelKey: string }>> = {
  transferencia_cheque_boveda: [
    { key: 'comite_disbursement_sum', labelKey: 'labels.pendientes.totalDisbursementComiteSession' }]
};

@Component({
  selector: 'mifosx-flow-detail',
  templateUrl: './flow-detail.component.html',
  styleUrls: ['./flow-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class FlowDetailComponent implements OnInit {
  flow: any;
  loading = true;
  error: string | null = null;

  /** When stepId query is present, only this step is shown; otherwise all flow.steps. */
  displaySteps: any[] = [];

  /** Step id -> block key -> { value, loading, error } for step-specific detail blocks. */
  stepBlockData: Record<number, Record<string, { value?: unknown; loading?: boolean; error?: string }>> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pendientesService: PendientesService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private authenticationService: AuthenticationService,
    private comiteOtorgamientoService: ComiteOtorgamientoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pendientesService.getFlow(+id, true).subscribe({
        next: (data) => {
          this.flow = data;
          this.stepBlockData = {};
          const steps = Array.isArray(this.flow?.steps) ? this.flow.steps : [];
          steps.forEach((step: any) => this.loadStepBlockData(step));
          this.applyStepIdFilter();
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
    if (this.hasExistingNextStep(this.flow, step)) {
      this.pendientesService.completeStep(step.id).subscribe({
        next: () => this.refreshFlow(),
        error: (err) => {
          this.error =
            err?.error?.errors?.[0]?.defaultUserMessage ||
            err.message ||
            this.translate.instant('labels.text.Error completing step');
        }
      });
      return;
    }
    this.resolveNextStepDetails(step, (nextStepDetails) => {
      if (this.isLastStepInBlueprint(nextStepDetails)) {
        this.pendientesService.completeStep(step.id).subscribe({
          next: () => this.refreshFlow(),
          error: (err) => {
            this.error =
              err?.error?.errors?.[0]?.defaultUserMessage ||
              err.message ||
              this.translate.instant('labels.text.Error completing step');
          }
        });
        return;
      }
      const credentials = this.authenticationService.getCredentials();
      const officeId = credentials?.officeId != null && credentials.officeId !== 0 ? credentials.officeId : null;
      if (officeId == null) {
        this.error = this.translate.instant('labels.text.Current user office is required to complete this step');
        return;
      }
      const dialogRef = this.dialog.open(CompleteStepNextDialogComponent, {
        data: nextStepDetails,
        width: '400px'
      });
      this.subscribeToCompleteDialog(dialogRef, step, officeId);
    });
  }

  /** True when there is no next step in the blueprint (current step is the last). */
  private isLastStepInBlueprint(nextStepDetails: CompleteStepNextDialogData): boolean {
    return !nextStepDetails?.nextStepName;
  }

  /**
   * Resolves next step name and description from the flow's blueprint (if any),
   * then invokes the callback with dialog data to show in the complete-step-next dialog.
   */
  private resolveNextStepDetails(step: any, callback: (data: CompleteStepNextDialogData) => void): void {
    const blueprintId = this.flow?.pendingFlowBlueprintId;
    if (blueprintId == null) {
      callback({});
      return;
    }
    this.pendientesService.getBlueprint(blueprintId).subscribe({
      next: (blueprint: { steps?: string }) => {
        const details = this.getNextStepFromBlueprint(blueprint?.steps, step?.name);
        callback(details);
      },
      error: () => callback({})
    });
  }

  private getNextStepFromBlueprint(
    stepsJson: string | undefined,
    currentStepName: string | undefined
  ): CompleteStepNextDialogData {
    if (!stepsJson || currentStepName == null) return {};
    try {
      const steps: Array<{ name?: string; description?: string }> = JSON.parse(stepsJson);
      if (!Array.isArray(steps)) return {};
      const idx = steps.findIndex((s: any) => (s?.name ?? '') === currentStepName);
      if (idx < 0 || idx + 1 >= steps.length) return {};
      const next = steps[idx + 1];
      return {
        nextStepName: next?.name ?? undefined,
        nextStepDescription: next?.description ?? undefined
      };
    } catch {
      return {};
    }
  }

  private subscribeToCompleteDialog(
    dialogRef: {
      afterClosed: () => import('rxjs').Observable<
        { responsableUserId: number; dueDate: Date | null; description?: string } | undefined
      >;
    },
    step: any,
    officeId: number
  ): void {
    dialogRef
      .afterClosed()
      .subscribe((result: { responsableUserId: number; dueDate: Date | null; description?: string } | undefined) => {
        if (result == null) return;
        const nextStep: { responsableUserId: number; dueDate?: string | Date; officeId: number; description?: string } =
          {
            responsableUserId: result.responsableUserId,
            dueDate: result.dueDate ?? undefined,
            officeId,
            description: result.description
          };
        this.pendientesService.completeStep(step.id, { nextStep }).subscribe({
          next: () => this.refreshFlow(),
          error: (err) => {
            this.error =
              err?.error?.errors?.[0]?.defaultUserMessage ||
              err.message ||
              this.translate.instant('labels.text.Error completing step');
          }
        });
      });
  }

  private refreshFlow(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.pendientesService.getFlow(+id, true).subscribe({
      next: (data) => {
        this.flow = data;
        this.stepBlockData = {};
        const steps = Array.isArray(this.flow?.steps) ? this.flow.steps : [];
        steps.forEach((step: any) => this.loadStepBlockData(step));
        this.applyStepIdFilter();
        this.error = null;
      },
      error: (err) => {
        this.error =
          err?.error?.errors?.[0]?.defaultUserMessage ||
          err.message ||
          this.translate.instant('labels.text.Error loading flow');
      }
    });
  }

  cancelStep(step: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        heading: this.translate.instant('labels.buttons.CancelarPendiente'),
        dialogContext: this.translate.instant('labels.dialogContext.Confirm cancel pending step'),
        type: 'Critical'
      }
    });
    dialogRef.afterClosed().subscribe((response: { confirm?: boolean }) => {
      if (response?.confirm) {
        this.pendientesService.cancelStep(step.id).subscribe({
          next: () => this.refreshFlow(),
          error: (err) => {
            this.error =
              err?.error?.errors?.[0]?.defaultUserMessage ||
              err.message ||
              this.translate.instant('labels.text.Error canceling step');
          }
        });
      }
    });
  }

  /** True if the current user is the step's assigned responsable (only they can Complete/Cancel). */
  isResponsableForStep(step: any): boolean {
    const currentUserId = this.authenticationService.getCredentials()?.userId;
    if (currentUserId == null) return false;
    const responsableId = step?.responsableUserId != null ? Number(step.responsableUserId) : null;
    return responsableId != null && currentUserId === responsableId;
  }

  canComplete(step: any): boolean {
    if (!this.isResponsableForStep(step)) return false;
    if (step.status === 'completed') return false;
    if (step.status === 'cancelado') return false;
    if (!step.previousStepId) return true;
    const prev = this.flow?.steps?.find((s: any) => s.id === step.previousStepId);
    return prev?.status === 'completed';
  }

  canCancel(step: any): boolean {
    if (!this.isResponsableForStep(step)) return false;
    if (step.status === 'completed') return false;
    if (step.status === 'cancelado') return false;
    if (!step.previousStepId) return true;
    const prev = this.flow?.steps?.find((s: any) => s.id === step.previousStepId);
    return prev?.status === 'completed';
  }

  getNextPendingStep(flow: any, step: any): any {
    return flow?.steps?.find((s: any) => s.previousStepId === step.id);
  }

  hasExistingNextStep(flow: any, step: any): boolean {
    return this.getNextPendingStep(flow, step) != null;
  }

  isLastStep(flow: any, step: any): boolean {
    return !this.hasExistingNextStep(flow, step);
  }

  isStepFinished(step: any): boolean {
    return step?.status === 'completed' || step?.status === 'cancelado';
  }

  back(): void {
    this.router.navigate(['/pendientes']);
  }

  /** True when the URL had a stepId query (used to show "step not found" if filter returned empty). */
  get hasStepIdQuery(): boolean {
    const p = this.route.snapshot.queryParamMap.get('stepId');
    return p != null && p !== '';
  }

  /** Applies optional stepId query param: show only that step, or all steps if absent/invalid. */
  private applyStepIdFilter(): void {
    const stepIdParam = this.route.snapshot.queryParamMap.get('stepId');
    const steps = Array.isArray(this.flow?.steps) ? this.flow.steps : [];
    if (stepIdParam != null && stepIdParam !== '') {
      const stepId = +stepIdParam;
      const match = Number.isFinite(stepId) ? steps.find((s: any) => s.id === stepId) : null;
      this.displaySteps = match != null ? [match] : [];
    } else {
      this.displaySteps = steps;
    }
  }

  /** Resolves block component for NgComponentOutlet (from block-registry). */
  getBlockComponent = getBlockComponent;

  getStepBlocks(step: any): Array<{ key: string; labelKey: string }> {
    const name = (step?.name ?? step?.stepName ?? '')?.trim?.() ?? '';
    if (!name) return [];
    return STEP_DETAIL_BLOCKS[name] ?? [];
  }

  getBlockData(stepId: number, blockKey: string): { value?: unknown; loading?: boolean; error?: string } | undefined {
    return this.stepBlockData[stepId]?.[blockKey];
  }

  private loadStepBlockData(step: any): void {
    const blocks = this.getStepBlocks(step);
    if (blocks.length === 0) return;
    const stepId = step.id;
    const initial: Record<string, { value?: unknown; loading?: boolean; error?: string }> = {};
    blocks.forEach((block) => {
      initial[block.key] = { loading: true };
      if (block.key === 'comite_disbursement_sum') {
        this.loadComiteDisbursementSumBlock(step, stepId, block.key);
      }
    });
    this.stepBlockData = { ...this.stepBlockData, [stepId]: initial };
  }

  private loadComiteDisbursementSumBlock(step: any, stepId: number, blockKey: string): void {
    const sessionId = this.parseSessionIdFromReferences(step.references);
    if (sessionId == null || sessionId <= 0) {
      this.setBlockData(stepId, blockKey, {
        loading: false,
        error: this.translate.instant('labels.pendientes.noSessionLinked')
      });
      return;
    }
    const officeId = step.officeId ?? this.authenticationService.getCredentials()?.officeId ?? undefined;
    this.comiteOtorgamientoService.getApprovedLoansDisbursementSum(sessionId, officeId).subscribe({
      next: (data) => {
        this.setBlockData(stepId, blockKey, { loading: false, value: data });
      },
      error: (err) => {
        this.setBlockData(stepId, blockKey, {
          loading: false,
          error:
            err?.error?.errors?.[0]?.defaultUserMessage ??
            err?.message ??
            this.translate.instant('labels.text.Error loading data')
        });
      }
    });
  }

  private setBlockData(
    stepId: number,
    blockKey: string,
    data: { value?: unknown; loading?: boolean; error?: string }
  ): void {
    this.stepBlockData = {
      ...this.stepBlockData,
      [stepId]: { ...this.stepBlockData[stepId], [blockKey]: data }
    };
  }

  private parseSessionIdFromReferences(references: string | null | undefined): number | null {
    if (references == null || typeof references !== 'string' || references.trim() === '') return null;
    try {
      const root = JSON.parse(references) as Record<string, unknown>;
      const sesion = root?.m_sesiones_comite as Record<string, unknown> | undefined;
      if (sesion == null) return null;
      const id = sesion.id;
      if (typeof id === 'number' && !Number.isNaN(id)) return id;
      if (typeof id === 'string') {
        const n = parseInt(id, 10);
        return !Number.isNaN(n) && n > 0 ? n : null;
      }
      return null;
    } catch {
      return null;
    }
  }
}
