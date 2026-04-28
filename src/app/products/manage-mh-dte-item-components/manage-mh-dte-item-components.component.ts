import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { ProductsService } from '../products.service';
import { MhDteItemComponentsListRefreshService } from './mh-dte-item-components-list-refresh.service';

@Component({
  selector: 'mifosx-manage-mh-dte-item-components',
  templateUrl: './manage-mh-dte-item-components.component.html',
  styleUrls: ['./manage-mh-dte-item-components.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    RouterLink
  ]
})
export class ManageMhDteItemComponentsComponent implements OnInit {
  items: any[] = [];
  displayedColumns: string[] = [
    'name',
    'dteAmountType',
    'target',
    'clientType'
  ];
  dataSource: MatTableDataSource<any>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private productsService: ProductsService,
    private mhDteItemComponentsListRefreshService: MhDteItemComponentsListRefreshService,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit(): void {
    let pendingRefresh = this.mhDteItemComponentsListRefreshService.consumeShouldRefresh();
    this.route.data.subscribe((data: { mhDteItemComponents: any[] }) => {
      this.items = data.mhDteItemComponents || [];
      this.applyItemsToTable();
      if (pendingRefresh) {
        pendingRefresh = false;
        this.refreshList();
      }
      this.cdr.detectChanges();
    });
  }

  private applyItemsToTable(): void {
    this.dataSource = new MatTableDataSource([...this.items]);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /** Refetch list with cache-bust after create/update/delete (see docs/autorefresh_frontend.md). */
  private refreshList(): void {
    this.productsService.getMhDteItemComponents(true).subscribe({
      next: (data: any[]) => {
        this.items = data || [];
        this.applyItemsToTable();
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  targetLabel(row: any): string {
    if (row.chargeId != null) {
      return `Charge #${row.chargeId}`;
    }
    if (row.loanComponent) {
      return `Loan: ${row.loanComponent}`;
    }
    return '';
  }
}
