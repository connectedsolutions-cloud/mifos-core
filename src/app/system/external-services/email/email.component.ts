/** Angular Imports */
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslateService } from '@ngx-translate/core';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SystemService } from '../../system.service';

/**
 * Email Configuration Component.
 */
@Component({
  selector: 'mifosx-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
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
    MatRow
  ]
})
export class EmailComponent implements OnInit {
  /** Email configuration data. */
  emailConfigurationData: any;
  /** Columns to be displayed in Email configuration table. */
  displayedColumns: string[] = [
    'name',
    'value'
  ];
  /** Data source for Email configuration table. */
  dataSource: MatTableDataSource<any>;
  /** True while the SMTP connection test is in flight. */
  testingConnection = false;

  /** Sorter for Email configuration table. */
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  /**
   * Retrieves the Email configuration data from `resolve`.
   * @param {ActivatedRoute} route Activated Route.
   * @param {SystemService} systemService System Service.
   * @param {MatSnackBar} snackBar Material Snackbar.
   * @param {TranslateService} translateService Translate Service.
   */
  constructor(
    private route: ActivatedRoute,
    private systemService: SystemService,
    private snackBar: MatSnackBar,
    private translateService: TranslateService
  ) {
    this.route.data.subscribe((data: { emailConfiguration: any }) => {
      this.emailConfigurationData = data.emailConfiguration;
    });
  }

  /**
   * Sets the Email Configuration table.
   */
  ngOnInit() {
    this.setEmailConfiguration();
  }

  /**
   * Initializes the data source and sorter for Email configuration table.
   */
  setEmailConfiguration() {
    this.dataSource = new MatTableDataSource(this.emailConfigurationData);
    this.dataSource.sort = this.sort;
  }

  /**
   * Tests the currently saved SMTP connection.
   */
  testConnection() {
    this.testingConnection = true;
    this.systemService.testSmtpConnection().subscribe({
      next: (result) => {
        this.testingConnection = false;
        if (result.connected) {
          this.snackBar.open(this.translateService.instant('labels.text.SMTP connection successful'), 'Close', {
            duration: 4000
          });
        } else {
          const detail = result.errorMessage ? `: ${result.errorMessage}` : '';
          this.snackBar.open(
            `${this.translateService.instant('labels.text.SMTP connection failed')}${detail}`,
            'Close',
            { duration: 8000 }
          );
        }
      },
      error: () => {
        this.testingConnection = false;
      }
    });
  }
}
