import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ComiteOtorgamientoService } from './comite-otorgamiento.service';
import { CreateSesionComiteDialogComponent } from './create-sesion-comite-dialog/create-sesion-comite-dialog.component';
import { STANDALONE_SHARED_IMPORTS } from '../standalone-shared.module';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mifosx-comite-otorgamiento',
  templateUrl: './comite-otorgamiento.component.html',
  styleUrls: ['./comite-otorgamiento.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class ComiteOtorgamientoComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'name',
    'status',
    'creatorName',
    'createdAt',
    'participantCount'
  ];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private router: Router,
    private service: ComiteOtorgamientoService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // Set default sort to createdAt descending
    const sortState: Sort = { active: 'createdAt', direction: 'desc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
  }

  loadSessions(skipCache?: boolean): void {
    this.service.getSessions(skipCache).subscribe({
      next: (response: any) => {
        const items = response || [];
        this.dataSource = new MatTableDataSource<any>(items);
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
        this.cdr.detectChanges();
      }
    });
  }

  createSession(): void {
    const dialogRef = this.dialog.open(CreateSesionComiteDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSessions(true);
      }
    });
  }

  viewSession(row: any): void {
    this.router.navigate([
      '/comite-otorgamiento',
      row.id,
      'edit'
    ]);
  }
}
