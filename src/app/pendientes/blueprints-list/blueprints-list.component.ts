import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PendientesService } from '../pendientes.service';
import { STANDALONE_SHARED_IMPORTS } from '../../standalone-shared.module';

@Component({
  selector: 'mifosx-blueprints-list',
  templateUrl: './blueprints-list.component.html',
  styleUrls: ['./blueprints-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class BlueprintsListComponent implements OnInit {
  blueprints: any[] = [];
  loading = true;

  constructor(
    private router: Router,
    private pendientesService: PendientesService
  ) {}

  ngOnInit(): void {
    this.pendientesService.getBlueprints().subscribe({
      next: (data: any) => {
        this.blueprints = Array.isArray(data) ? data : (data?.pageItems ?? data ?? []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/pendientes']);
  }
}
