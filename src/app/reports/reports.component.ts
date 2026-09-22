/** Angular Imports */
import { Component, OnInit, ViewChild } from '@angular/core';
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { AuthenticationService } from '../core/authentication/authentication.service';
import { ReportsService } from './reports.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Reports component.
 */
@Component({
  selector: 'mifosx-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
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
    MatIcon,
    MatIconButton
  ]
})
export class ReportsComponent implements OnInit {
  /** Reports data. */
  reportsData: any;
  /** Report category filter. */
  filter: string;
  /** Columns to be displayed in reports table. */
  displayedColumns: string[] = [
    'reportName',
    'reportType',
    'reportCategory',
    'saved'
  ];
  /** Data source for reports table. */
  dataSource = new MatTableDataSource<any>();
  savedReportIds = new Set<number>();
  pendingReportIds = new Set<number>();
  savedReportsLoading = true;
  savedReportsError = false;
  searchTerm = '';
  private filterVersion = 0;
  readonly savedSection = 'saved';

  /** Paginator for reports table. */
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  /** Sorter for reports table. */
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  /**
   * Retrieves the reports data from `resolve`.
   * @param {ActivatedRoute} route Activated Route.
   * Prevents reuse of route parameter `filter`.
   * @param {Router} router: Router.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translateService: TranslateService,
    private authenticationService: AuthenticationService,
    private reportsService: ReportsService
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.route.data.subscribe((data: { reports: any }) => {
      this.reportsData = data.reports;
    });
    this.filter = this.route.snapshot.params['filter'];
  }

  /*
   *Sets and filters the reports table by category.
   */
  ngOnInit() {
    this.setReports();
    this.filterReportsByCategory();
    this.reportsService.getSavedReportIds().subscribe({
      next: (ids) => {
        this.savedReportIds = new Set(ids);
        this.savedReportsLoading = false;
        this.refreshFilter();
      },
      error: () => {
        this.savedReportsLoading = false;
        this.savedReportsError = true;
      }
    });
  }

  /**
   * Switches filterPredicate if filterValue is not null.
   * @param {string} filterValue filter string for mat-table.
   */
  applyFilter(filterValue: string) {
    this.searchTerm = filterValue.trim().toLowerCase();
    this.refreshFilter();
  }

  /**
   * Only list reports the current user can run. The API also enforces this when
   * a report is saved or run.
   */
  setReports() {
    const permissions = this.authenticationService.getCredentials()?.permissions ?? [];
    const canReadAll =
      permissions.includes('ALL_FUNCTIONS') ||
      permissions.includes('ALL_FUNCTIONS_READ') ||
      permissions.includes('REPORTING_SUPER_USER');
    this.dataSource = new MatTableDataSource(
      (this.reportsData ?? []).filter(
        (report: any) => report.useReport === true && (canReadAll || permissions.includes('READ_' + report.reportName))
      )
    );
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  filterReportsByCategory() {
    this.searchTerm = '';
    this.dataSource.filterPredicate = (report: any) => {
      const matchesSection =
        !this.filter ||
        (this.filter === this.savedSection
          ? this.savedReportIds.has(report.id)
          : report.reportCategory === this.filter);
      const matchesSearch =
        !this.searchTerm ||
        this.getTranslatedReportName(report.reportName).toLowerCase().includes(this.searchTerm) ||
        Object.values(report).some((value) => String(value).toLowerCase().includes(this.searchTerm));
      return matchesSection && matchesSearch;
    };
    this.refreshFilter();
  }

  private refreshFilter() {
    // MatTableDataSource invokes its predicate only for a nonempty filter string.
    this.dataSource.filter = String(++this.filterVersion);
    this.dataSource.paginator?.firstPage();
  }

  toggleSaved(event: Event, report: any) {
    event.stopPropagation();
    if (this.pendingReportIds.has(report.id) || this.savedReportsLoading || this.savedReportsError) {
      return;
    }
    this.savedReportsError = false;
    this.pendingReportIds.add(report.id);
    const wasSaved = this.savedReportIds.has(report.id);
    const request = wasSaved
      ? this.reportsService.removeSavedReport(report.id)
      : this.reportsService.saveReport(report.id);
    request.subscribe({
      next: () => {
        if (wasSaved) {
          this.savedReportIds.delete(report.id);
        } else {
          this.savedReportIds.add(report.id);
        }
        this.pendingReportIds.delete(report.id);
        this.refreshFilter();
      },
      error: () => {
        this.pendingReportIds.delete(report.id);
        this.savedReportsError = true;
      }
    });
  }

  /**
   * Gets the translated report name with fallback to original name.
   * @param {string} reportName Original report name.
   * @returns {string} Translated report name or original if translation not found.
   */
  getTranslatedReportName(reportName: string): string {
    const key = 'labels.reports.' + reportName;
    const translation = this.translateService.instant(key);
    return translation !== key ? translation : reportName;
  }
}
