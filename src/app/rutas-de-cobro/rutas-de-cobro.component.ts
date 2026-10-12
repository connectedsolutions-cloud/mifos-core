import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconButton } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RutasDeCobroService } from './rutas-de-cobro.service';
import { DeleteDialogComponent } from 'app/shared/delete-dialog/delete-dialog.component';
import { STANDALONE_SHARED_IMPORTS } from '../standalone-shared.module';

@Component({
  selector: 'mifosx-rutas-de-cobro',
  templateUrl: './rutas-de-cobro.component.html',
  styleUrls: ['./rutas-de-cobro.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconButton,
    MatPaginatorModule,
    MatSortModule,
    FaIconComponent,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class RutasDeCobroComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'routeName',
    'responsibleStaffName',
    'officeName',
    'clientCount',
    'actions'
  ];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private router: Router,
    private service: RutasDeCobroService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoutes(true);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  loadRoutes(skipCache?: boolean): void {
    this.service.getRoutes(skipCache).subscribe({
      next: (response: any) => {
        const items = Array.isArray(response) ? response : [];
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

  createRoute(): void {
    this.router.navigate(['/rutas-de-cobro/create']);
  }

  editRoute(row: any): void {
    this.router.navigate([
      '/rutas-de-cobro',
      row.id,
      'edit'
    ]);
  }

  deleteRoute(event: Event, row: any): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: row.routeName }
    });
    dialogRef.afterClosed().subscribe((response: any) => {
      if (response?.delete) {
        this.service.deleteRoute(row.id).subscribe(() => this.loadRoutes(true));
      }
    });
  }
}
