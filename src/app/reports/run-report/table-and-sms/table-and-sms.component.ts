/** Angular Imports */
import { Component, Input, ViewChild, OnChanges } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
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
import { DecimalPipe, NgIf, NgFor } from '@angular/common';

/** Custom Servies */
import { ReportsService } from '../../reports.service';
import { MatDialog } from '@angular/material/dialog';
import { FormfieldBase } from 'app/shared/form-dialog/formfield/model/formfield-base';
import { SelectBase } from 'app/shared/form-dialog/formfield/model/select-base';
import { InputBase } from 'app/shared/form-dialog/formfield/model/input-base';
import { FormDialogComponent } from 'app/shared/form-dialog/form-dialog.component';
import { environment } from '../../../../environments/environment';
import { ProgressBarService } from 'app/core/progress-bar/progress-bar.service';

import * as ExcelJS from 'exceljs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { REPORT_ROW_LINK_CONFIGS, buildEntityUrl, getLinkOnlyColumnNames } from './report-row-link.config';

/**
 * Table and SMS Component
 */
@Component({
  selector: 'mifosx-table-and-sms',
  templateUrl: './table-and-sms.component.html',
  styleUrls: ['./table-and-sms.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    FaIconComponent
  ]
})
export class TableAndSmsComponent implements OnChanges {
  /** Run Report Data */
  @Input() dataObject: any;

  /** Full column list from API (used for URL building and row indexing) */
  displayedColumns: string[] = [];
  /** Columns visible in table (excluding link-only columns when row-link config exists) */
  visibleColumns: string[] = [];
  /** Data source for run-report table. */
  dataSource = new MatTableDataSource();
  /** Maps column name to type */
  columnTypes: any[] = [];
  /** substitute for resolver */
  hideOutput = true;
  /** Data to be converted into CSV file */
  csvData: any;
  notExistsReportData = false;
  toBeExportedToRepo = false;

  /** Paginator for run-report table. */
  @ViewChild(MatPaginator) paginator: MatPaginator;

  /**
   * @param {ReportsService} reportsService Reports Service
   * @param {DecimalPipe} decimalPipe Decimal Pipe
   */
  constructor(
    private reportsService: ReportsService,
    public dialog: MatDialog,
    private decimalPipe: DecimalPipe,
    private progressBarService: ProgressBarService
  ) {}

  /**
   * Fetches run report data post changes in run report form.
   */
  ngOnChanges() {
    this.hideOutput = true;
    this.columnTypes = [];
    this.displayedColumns = [];
    this.visibleColumns = [];
    this.getRunReportData();
  }

  getRunReportData() {
    const exportS3 = this.dataObject.formData.exportS3;
    this.reportsService
      .getRunReportData(this.dataObject.report.name, this.dataObject.formData)
      .subscribe((res: any) => {
        this.toBeExportedToRepo = exportS3;
        if (!this.toBeExportedToRepo) {
          this.csvData = res.data;
          this.notExistsReportData = res.data.length === 0;
          this.setOutputTable(res.data);
          res.columnHeaders.forEach((header: any) => {
            this.columnTypes.push(header.columnDisplayType);
            this.displayedColumns.push(header.columnName);
          });
          this.updateVisibleColumns();
        }
        this.hideOutput = false;
        this.progressBarService.decrease();
      });
  }

  /**
   * Sets up a dynamic Mat Table.
   * @param {any} data Mat Table data
   */
  setOutputTable(data: any) {
    this.dataSource = new MatTableDataSource(data);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  /**
   * Updates visible columns by excluding link-only columns when a row-link config exists.
   */
  private updateVisibleColumns(): void {
    const config = this.getRowLinkConfig();
    if (config) {
      const linkOnly = getLinkOnlyColumnNames(config);
      this.visibleColumns = this.displayedColumns.filter((c) => !linkOnly.includes(c));
    } else {
      this.visibleColumns = [...this.displayedColumns];
    }
  }

  /** Whether the current report has a row-link config (row click opens entity in new tab). */
  hasRowLinkConfig(): boolean {
    return this.getRowLinkConfig() != null;
  }

  private getRowLinkConfig() {
    const id = this.dataObject?.report?.id;
    return id != null ? REPORT_ROW_LINK_CONFIGS[id] : undefined;
  }

  /**
   * Index of a column in the full API row (displayedColumns). Used for cell value lookup.
   */
  getDisplayedColumnIndex(columnName: string): number {
    return this.displayedColumns.indexOf(columnName);
  }

  /**
   * Handles row click: opens entity URL in new tab when a row-link config exists.
   */
  onRowClick(row: { row: any[] }): void {
    const config = this.getRowLinkConfig();
    if (!config || !this.dataObject) {
      return;
    }
    const rowValuesByColumnName: Record<string, unknown> = {};
    this.displayedColumns.forEach((col, i) => {
      rowValuesByColumnName[col] = row.row[i];
    });
    const url = buildEntityUrl(config, rowValuesByColumnName);
    if (url) {
      const base = window.location.origin + (window.location.pathname || '');
      window.open(base + url, '_blank');
    }
  }

  /**
   * Generates the CSV file dynamically for run report data.
   */
  exportFile() {
    const delimiterOptions: any[] = [
      { name: 'Comma (,)', char: ',' },
      { name: 'Colon (:)', char: ':' },
      { name: 'SemiColon (;)', char: ';' },
      { name: 'Pipe (|)', char: '|' },
      { name: 'Space ( )', char: ' ' }
    ];
    const fileName = `${this.dataObject.report.name}.csv`;
    const formfields: FormfieldBase[] = [
      new SelectBase({
        controlName: 'delimiter',
        label: 'Delimiter',
        value: environment.defaultCharDelimiter,
        options: { label: 'name', value: 'char', data: delimiterOptions },
        required: true,
        order: 1
      }),
      new InputBase({
        controlName: 'fileName',
        label: 'File Name',
        value: fileName,
        type: 'text',
        required: true,
        order: 2
      })

    ];
    const data = {
      title: 'Export data to File',
      layout: { addButtonText: 'Export to File' },
      formfields: formfields
    };
    const exportDialogRef = this.dialog.open(FormDialogComponent, { data });
    exportDialogRef.afterClosed().subscribe((response: { data: any }) => {
      if (response.data) {
        this.downloadCSV(response.data.value.fileName, response.data.value.delimiter);
      }
    });
  }

  exportToXLS(): void {
    const fileName = `${this.dataObject.report.name}.xlsx`;
    const cols = this.visibleColumns;
    const data = this.csvData.map((object: any) => {
      const row: { [key: string]: any } = {};
      cols.forEach((col) => {
        const idx = this.displayedColumns.indexOf(col);
        row[col] = idx >= 0 ? object.row[idx] : undefined;
      });
      return row;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add header row (visible columns only)
    worksheet.addRow(cols);

    // Add data rows
    data.forEach((rowObj: any) => {
      worksheet.addRow(cols.map((col) => rowObj[col]));
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filename.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Generates the CSV file dynamically for run report data (visible columns only).
   */
  downloadCSV(fileName: string, delimiter: string) {
    const headers = this.visibleColumns;
    const idxList = headers.map((h) => this.displayedColumns.indexOf(h));
    let csv = this.csvData.map((object: any) => idxList.map((i) => (i >= 0 ? object.row[i] : '')).join(delimiter));
    csv.unshift(`data:text/csv;charset=utf-8,${headers.join(delimiter)}`);
    csv = csv.join('\r\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Returns number formatted as per user's decimal choice.
   * @param {number} value Value to be formatted as per decimal choice.
   */
  toDecimal(value: number) {
    const decimalChoice = this.dataObject.decimalChoice;
    return this.decimalPipe.transform(value, `1.${decimalChoice}-${decimalChoice}`);
  }

  /**
   * Checks the weather Mat-Table column has decimal display type.
   * @param {number} index Index of column.
   */
  isDecimal(index: number) {
    return this.columnTypes[index] === 'DECIMAL';
  }
}
