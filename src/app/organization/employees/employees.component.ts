/** Angular Imports */
import { ChangeDetectorRef, Component, OnInit, TemplateRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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

/** Custom Services */
import { OrganizationService } from '../organization.service';
import { EmployeeListRefreshService } from './employee-list-refresh.service';
import { PopoverService } from '../../configuration-wizard/popover/popover.service';
import { ConfigurationWizardService } from '../../configuration-wizard/configuration-wizard.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Employees component.
 */
@Component({
  selector: 'mifosx-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
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
    MatTooltip,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator
  ]
})
export class EmployeesComponent implements OnInit, AfterViewInit {
  /** Employees data. */
  employeesData: any;
  /** Columns to be displayed in employees table. */
  displayedColumns: string[] = [
    'displayName',
    'isLoanOfficer',
    'officeName',
    'isActive'
  ];
  /** Data source for employees table. */
  dataSource: MatTableDataSource<any>;

  /** Paginator for employees table. */
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  /** Sorter for employees table. */
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  /* Reference of import employees button */
  @ViewChild('buttonImportEmployees') buttonImportEmployees: ElementRef<any>;
  /* Template for popover on import employees button */
  @ViewChild('templateButtonImportEmployees') templateButtonImportEmployees: TemplateRef<any>;
  /* Reference of employees table */
  @ViewChild('tableEmployees') tableEmployees: ElementRef<any>;
  /* Template for popover on employees table */
  @ViewChild('templateTableEmployees') templateTableEmployees: TemplateRef<any>;

  /**
   * Retrieves the employees data from `resolve`.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router.
   * @param {OrganizationService} organizationService Organization Service.
   * @param {EmployeeListRefreshService} employeeListRefreshService Signals refresh when returning from create.
   * @param {ConfigurationWizardService} configurationWizardService ConfigurationWizard Service.
   * @param {PopoverService} popoverService PopoverService.
   * @param {ChangeDetectorRef} cdr Change detector.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private organizationService: OrganizationService,
    private employeeListRefreshService: EmployeeListRefreshService,
    private configurationWizardService: ConfigurationWizardService,
    private popoverService: PopoverService,
    private cdr: ChangeDetectorRef
  ) {
    this.route.data.subscribe((data: { employees: any }) => {
      this.employeesData = data.employees;
    });
  }

  /**
   * Filters data in employees table based on passed value.
   * @param {string} filterValue Value to filter data.
   */
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * Sets the employees table.
   * Auto-refreshes with cache-bust when returning from create (see autorefresh_frontend.md).
   */
  ngOnInit() {
    this.setEmployees();
    if (this.employeeListRefreshService.consumeShouldRefresh()) {
      this.refreshEmployees();
    }
  }

  /**
   * Initializes the data source, paginator and sorter for employees table.
   */
  setEmployees() {
    this.dataSource = new MatTableDataSource(this.employeesData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Refetches employees with cache-bust and updates the table (auto-refresh after create).
   */
  refreshEmployees() {
    this.organizationService.getEmployees(true).subscribe({
      next: (data) => {
        this.employeesData = data;
        this.dataSource = new MatTableDataSource(this.employeesData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Popover function
   * @param template TemplateRef<any>.
   * @param target HTMLElement | ElementRef<any>.
   * @param position String.
   * @param backdrop Boolean.
   */
  showPopover(
    template: TemplateRef<any>,
    target: HTMLElement | ElementRef<any>,
    position: string,
    backdrop: boolean
  ): void {
    setTimeout(() => this.popoverService.open(template, target, position, backdrop, {}), 200);
  }

  /**
   * To show popover.
   */
  ngAfterViewInit() {
    if (this.configurationWizardService.showEmployeeList === true) {
      setTimeout(() => {
        this.showPopover(this.templateButtonImportEmployees, this.buttonImportEmployees.nativeElement, 'bottom', true);
      });
    }
    if (this.configurationWizardService.showEmployeeTable === true) {
      setTimeout(() => {
        this.showPopover(this.templateTableEmployees, this.tableEmployees.nativeElement, 'top', true);
      });
    }
  }

  /**
   * Next Step (Create Employee Page) Configuration Wizard.
   */
  nextStep() {
    this.configurationWizardService.showEmployeeList = false;
    this.configurationWizardService.showEmployeeTable = false;
    this.configurationWizardService.showEmployeeForm = true;
    this.router.navigate(['/organization/employees/create']);
  }

  /**
   * Previous Step (Manage Employees) Configuration Wizard.
   */
  previousStep() {
    this.configurationWizardService.showEmployeeList = false;
    this.configurationWizardService.showEmployeeTable = false;
    this.configurationWizardService.showCreateEmployee = true;
    this.router.navigate(['/organization']);
  }
}
