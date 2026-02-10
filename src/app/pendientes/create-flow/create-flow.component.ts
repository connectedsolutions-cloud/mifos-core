import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PendientesService } from '../pendientes.service';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';

@Component({
  selector: 'mifosx-create-flow',
  templateUrl: './create-flow.component.html',
  styleUrls: ['./create-flow.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class CreateFlowComponent implements OnInit {
  form: FormGroup;
  blueprints: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private pendientesService: PendientesService,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      blueprintId: [null],
      name: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.pendientesService.getBlueprints().subscribe({
      next: (data: any) => {
        this.blueprints = Array.isArray(data) ? data : (data?.pageItems ?? data ?? []);
        if (this.blueprints.length && !this.form.get('blueprintId')?.value) {
          this.form.patchValue({ blueprintId: this.blueprints[0].id });
        }
      }
    });
  }

  submit(): void {
    const blueprintId = this.form.get('blueprintId')?.value;
    if (blueprintId == null) {
      this.error = this.translate.instant('labels.text.Select a blueprint');
      return;
    }
    this.loading = true;
    this.error = null;
    const body = {
      name: this.form.get('name')?.value || undefined,
      description: this.form.get('description')?.value || undefined
    };
    this.pendientesService.createFlow(blueprintId, body).subscribe({
      next: (flow: any) => {
        this.router.navigate([
          '/pendientes/flows',
          flow.id
        ]);
      },
      error: (err) => {
        this.error =
          err?.error?.errors?.[0]?.defaultUserMessage ||
          err.message ||
          this.translate.instant('labels.text.Error creating flow');
        this.loading = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/pendientes']);
  }
}
