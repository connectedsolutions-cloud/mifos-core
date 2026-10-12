/** Angular Imports. */
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort, MatSortHeader } from '@angular/material/sort';
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
import { of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

/** Custom Services */
import { environment } from '../../environments/environment';
import { ClientsService } from './clients.service';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoaderComponent } from 'app/shared/loader/loader.component';
import { AccountNumberComponent } from '../shared/account-number/account-number.component';
import { ExternalIdentifierComponent } from '../shared/external-identifier/external-identifier.component';
import { StatusLookupPipe } from '../pipes/status-lookup.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    NgxMatSelectSearchModule,
    FaIconComponent,
    LoaderComponent,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    AccountNumberComponent,
    ExternalIdentifierComponent,
    NgClass,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    StatusLookupPipe
  ]
})
export class ClientsComponent implements OnInit, OnDestroy {
  displayedColumns = [
    'displayName',
    'accountNumber',
    'externalId',
    'status',
    'officeName'
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  existsClientsToFilter = false;
  notExistsClientsToFilter = false;

  totalRows: number;
  isLoading = false;

  pageSize = 50;
  currentPage = 0;
  filterText = '';

  sortAttribute = '';
  sortDirection = '';

  officeIdControl = new FormControl<number | null>(null);
  statusControl = new FormControl<string | null>(null);
  tagIdControl = new FormControl<number | null>(null);
  promoterStaffIdControl = new FormControl<number | null>(null);
  accountExecutiveStaffIdControl = new FormControl<number | null>(null);
  collectionsManagerStaffIdControl = new FormControl<number | null>(null);

  officeFilterCtrl = new FormControl('');
  promoterFilterCtrl = new FormControl('');
  accountExecutiveFilterCtrl = new FormControl('');
  collectionsManagerFilterCtrl = new FormControl('');

  officeOptions: any[] = [];
  filteredOffices: any[] = [];
  tagOptions: any[] = [];
  promoterOptions: any[] = [];
  filteredPromoters: any[] = [];
  accountExecutiveOptions: any[] = [];
  filteredAccountExecutives: any[] = [];
  collectionsManagerOptions: any[] = [];
  filteredCollectionsManagers: any[] = [];

  statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
    { value: 'TRANSFER_IN_PROGRESS', label: 'Transfer in progress' },
    { value: 'TRANSFER_ON_HOLD', label: 'Transfer on hold' }
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('clientSearchInput') clientSearchInput?: ElementRef<HTMLInputElement>;

  private readonly destroy$ = new Subject<void>();
  private readonly clientsRequest$ = new Subject<void>();

  constructor(private clientService: ClientsService) {}

  ngOnInit() {
    this.officeFilterCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.filteredOffices = this.filterOptions(this.officeOptions, this.officeFilterCtrl.value, 'name');
    });
    this.promoterFilterCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.filteredPromoters = this.filterOptions(this.promoterOptions, this.promoterFilterCtrl.value, 'displayName');
    });
    this.accountExecutiveFilterCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.filteredAccountExecutives = this.filterOptions(
        this.accountExecutiveOptions,
        this.accountExecutiveFilterCtrl.value,
        'displayName'
      );
    });
    this.collectionsManagerFilterCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.filteredCollectionsManagers = this.filterOptions(
        this.collectionsManagerOptions,
        this.collectionsManagerFilterCtrl.value,
        'displayName'
      );
    });

    this.clientsRequest$
      .pipe(
        switchMap(() =>
          this.clientService
            .searchByText(this.filterText, this.currentPage, this.pageSize, this.sortAttribute, this.sortDirection, {
              officeId: this.officeIdControl.value,
              status: this.statusControl.value,
              tagId: this.tagIdControl.value,
              promoterStaffId: this.promoterStaffIdControl.value,
              accountExecutiveStaffId: this.accountExecutiveStaffIdControl.value,
              collectionsManagerStaffId: this.collectionsManagerStaffIdControl.value
            })
            .pipe(catchError(() => of(null)))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((data: any) => {
        this.isLoading = false;
        if (!data) {
          return;
        }
        this.dataSource.data = data.content;
        this.totalRows = data.totalElements;
        this.existsClientsToFilter = data.numberOfElements > 0;
        this.notExistsClientsToFilter = !this.existsClientsToFilter;
      });

    this.loadSearchOptions();

    if (environment.preloadClients) {
      this.getClients();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Searches server for query and resource.
   */
  search(value: string) {
    this.filterText = value;
    this.resetPaginator();
    this.getClients();
  }

  onFilterChange() {
    this.resetPaginator();
    this.getClients();
  }

  onOfficeChange() {
    this.loadSearchOptions(() => this.onFilterChange());
  }

  clearFilters() {
    this.filterText = '';
    if (this.clientSearchInput) {
      this.clientSearchInput.nativeElement.value = '';
    }
    this.officeFilterCtrl.setValue('');
    this.promoterFilterCtrl.setValue('');
    this.accountExecutiveFilterCtrl.setValue('');
    this.collectionsManagerFilterCtrl.setValue('');
    this.officeIdControl.setValue(null);
    this.statusControl.setValue(null);
    this.tagIdControl.setValue(null);
    this.promoterStaffIdControl.setValue(null);
    this.accountExecutiveStaffIdControl.setValue(null);
    this.collectionsManagerStaffIdControl.setValue(null);
    this.resetPaginator();
    this.getClients();
    this.loadSearchOptions();
  }

  private loadSearchOptions(afterLoad?: () => void) {
    this.clientService
      .getClientSearchOptions(this.officeIdControl.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options: any) => {
          if (!this.officeOptions.length) {
            this.officeOptions = options?.offices || [];
            this.filteredOffices = this.filterOptions(this.officeOptions, this.officeFilterCtrl.value, 'name');
            this.tagOptions = options?.tags || [];
          }
          this.promoterOptions = options?.promoters || [];
          this.filteredPromoters = this.filterOptions(
            this.promoterOptions,
            this.promoterFilterCtrl.value,
            'displayName'
          );
          this.accountExecutiveOptions = options?.accountExecutives || [];
          this.filteredAccountExecutives = this.filterOptions(
            this.accountExecutiveOptions,
            this.accountExecutiveFilterCtrl.value,
            'displayName'
          );
          this.collectionsManagerOptions = options?.collectionsManagers || [];
          this.filteredCollectionsManagers = this.filterOptions(
            this.collectionsManagerOptions,
            this.collectionsManagerFilterCtrl.value,
            'displayName'
          );
          this.clearStaffSelectionIfMissing();
          afterLoad?.();
        },
        error: () => afterLoad?.()
      });
  }

  private clearStaffSelectionIfMissing() {
    const promoterId = this.promoterStaffIdControl.value;
    if (promoterId && !this.promoterOptions.some((staff: any) => Number(staff.id) === Number(promoterId))) {
      this.promoterStaffIdControl.setValue(null, { emitEvent: false });
    }
    const accountExecutiveId = this.accountExecutiveStaffIdControl.value;
    if (
      accountExecutiveId &&
      !this.accountExecutiveOptions.some((staff: any) => Number(staff.id) === Number(accountExecutiveId))
    ) {
      this.accountExecutiveStaffIdControl.setValue(null, { emitEvent: false });
    }
    const collectionsManagerId = this.collectionsManagerStaffIdControl.value;
    if (
      collectionsManagerId &&
      !this.collectionsManagerOptions.some((staff: any) => Number(staff.id) === Number(collectionsManagerId))
    ) {
      this.collectionsManagerStaffIdControl.setValue(null, { emitEvent: false });
    }
  }

  private getClients() {
    this.isLoading = true;
    this.clientsRequest$.next();
  }

  pageChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.getClients();
  }

  sortChanged(event: Sort) {
    if (event.direction === '') {
      this.sortDirection = '';
      this.sortAttribute = '';
    } else {
      this.sortAttribute = event.active;
      this.sortDirection = event.direction;
    }
    this.resetPaginator();
    this.getClients();
  }

  private resetPaginator() {
    this.currentPage = 0;
    this.paginator?.firstPage();
  }

  private filterOptions(items: any[], search: string | null, field: string): any[] {
    if (!search) {
      return items.slice();
    }
    const term = search.toLowerCase();
    return items.filter((item: any) =>
      String(item[field] || '')
        .toLowerCase()
        .includes(term)
    );
  }
}
