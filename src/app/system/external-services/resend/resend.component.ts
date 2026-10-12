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
 * Resend Configuration Component.
 */
@Component({
  selector: 'mifosx-resend',
  templateUrl: './resend.component.html',
  styleUrls: ['./resend.component.scss'],
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
export class ResendComponent implements OnInit {
  /** Resend configuration data. */
  resendConfigurationData: any;
  /** Columns to be displayed in Resend configuration table. */
  displayedColumns: string[] = [
    'name',
    'value'
  ];
  /** Data source for Resend configuration table. */
  dataSource: MatTableDataSource<any>;
  /** True while the Resend connection test is in flight. */
  testingConnection = false;

  /** Sorter for Resend configuration table. */
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  /**
   * Retrieves the Resend configuration data from `resolve`.
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
    this.route.data.subscribe((data: { resendConfiguration: any }) => {
      this.resendConfigurationData = data.resendConfiguration;
    });
  }

  /**
   * Sets the Resend Configuration table.
   */
  ngOnInit() {
    this.setResendConfiguration();
  }

  /**
   * Initializes the data source and sorter for Resend configuration table.
   */
  setResendConfiguration() {
    this.dataSource = new MatTableDataSource(this.resendConfigurationData);
    this.dataSource.sort = this.sort;
  }

  /**
   * Tests the currently saved Resend connection.
   */
  testConnection() {
    this.testingConnection = true;
    this.systemService.testExternalServiceConnection('RESEND').subscribe({
      next: (result) => {
        this.testingConnection = false;
        if (result.connected) {
          this.snackBar.open(this.translateService.instant('labels.text.Resend connection successful'), 'Close', {
            duration: 4000
          });
        } else {
          const detail = result.errorMessage ? `: ${result.errorMessage}` : '';
          this.snackBar.open(
            `${this.translateService.instant('labels.text.Resend connection failed')}${detail}`,
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
