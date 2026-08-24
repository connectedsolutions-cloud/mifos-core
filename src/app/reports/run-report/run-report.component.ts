/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AbstractControl,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

/** Custom Services */
import { ReportsService } from '../reports.service';
import { SettingsService } from 'app/settings/settings.service';

/** Custom Models */
import { ReportParameter } from '../common-models/report-parameter.model';
import { SelectOption } from '../common-models/select-option.model';
import { Dates } from 'app/core/utils/dates';
import { GlobalConfiguration } from 'app/system/configurations/global-configurations-tab/configuration.model';

import * as ExcelJS from 'exceljs';
import moment from 'moment';
import { AlertService } from 'app/core/alert/alert.service';
import { NgIf, NgFor, NgSwitch, NgSwitchCase } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TableAndSmsComponent } from './table-and-sms/table-and-sms.component';
import { ChartComponent } from './chart/chart.component';
import { PentahoComponent } from './pentaho/pentaho.component';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import {
  buildReporteSeguroWorkbook,
  downloadBlob,
  isReporteSeguro,
  resolveReportPeriodDates
} from './reporte-seguro-export';
import { buildReporteBcrWorkbook, isReporteBcr, resolveReporteBcrMetadata } from './reporte-bcr-export';

/** Predefined calendar date-range preset ids (non-month shortcuts). */
export type DateRangePresetId = 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear';

/**
 * Run report component.
 */
@Component({
  selector: 'mifosx-run-report',
  templateUrl: './run-report.component.html',
  styleUrls: ['./run-report.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    NgSwitch,
    NgSwitchCase,
    MatCheckbox,
    FaIconComponent,
    TableAndSmsComponent,
    ChartComponent,
    PentahoComponent
  ]
})
export class RunReportComponent implements OnInit {
  /** Minimum date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum date allowed. */
  maxDate = new Date();

  /** Contains report specifications i.e: name, type and id */
  report: any = {};
  /** Formatted data post labeling of report parameters fetched from API */
  paramData: ReportParameter[] = [];
  /** Array of all parent parameters */
  parentParameters: any[] = [];
  /** Parameter data to configure pentaho output */
  pentahoReportParameters: any[] = [];
  /** Data to be passed on to component selectors */
  dataObject: any;

  /** Initializes new form group eportForm */
  reportForm = new UntypedFormGroup({});
  /** Static Form control for decimal places in output */
  decimalChoice = new UntypedFormControl();

  /** Toggles Report form */
  isCollapsed = false;
  /** Toggles  Table output. */
  hideTable = true;
  /** Toggles Chart output */
  hideChart = true;
  /** Toggles Pentaho output */
  hidePentaho = true;
  /** Report uses dates */
  reportUsesDates = false;
  exportToS3Allowed = false;
  reportToBeExportedInRepository: any;
  exportToS3Repository: string;
  outputTypeOptions: any[] = [];

  isProcessing = false;

  /** Cached start/end date parameters when both exist. */
  startDateParam: ReportParameter | null = null;
  endDateParam: ReportParameter | null = null;
  /** Currently selected date-range preset (cleared on manual date edits). */
  selectedDateRangePreset: DateRangePresetId | null = null;
  /** Selected year-month value in `YYYY-MM` form. */
  selectedYearMonth: string | null = null;
  /** Year-month options for the month dropdown. */
  yearMonthOptions: { value: string; label: string }[] = [];
  /** Suppresses clearing the selected preset while applying a preset programmatically. */
  private applyingDateRangePreset = false;

  /** Predefined date-range shortcuts (quarters / years). Month is selected via dropdown. */
  dateRangePresets: { id: DateRangePresetId; labelKey: string }[] = [
    { id: 'thisQuarter', labelKey: 'labels.inputs.This Quarter' },
    { id: 'lastQuarter', labelKey: 'labels.inputs.Last Quarter' },
    { id: 'thisYear', labelKey: 'labels.inputs.This Year' },
    { id: 'lastYear', labelKey: 'labels.inputs.Last Year' }
  ];

  /** True when the report has both start and end date parameters. */
  get hasDateRangeParams(): boolean {
    return !!this.startDateParam && !!this.endDateParam;
  }

  /**
   * Fetches report specifications from route params and retrieves report parameters data from `resolve`.
   * @param {ActivatedRoute} route ActivatedRoute.
   * @param {ReportsService} reportsService ReportsService
   * @param {SettingsService} settingsService Settings Service
   * @param {Dates} dateUtils Date Utils
   */
  constructor(
    private route: ActivatedRoute,
    private reportsService: ReportsService,
    private settingsService: SettingsService,
    private alertService: AlertService,
    private dateUtils: Dates
  ) {
    this.report.name = this.route.snapshot.params['name'];
    this.route.queryParams.subscribe((queryParams: { type: any; id: any }) => {
      this.report.type = queryParams.type;
      this.report.id = queryParams.id;
    });
    this.route.data.subscribe((data: { reportParameters: ReportParameter[]; configurations: any }) => {
      this.paramData = data.reportParameters;
      if (this.isTableReport()) {
        const amazonS3Config = data.configurations.globalConfiguration.find(
          (config: GlobalConfiguration) => config.name === 'amazon-s3'
        );
        const reportExportS3Config = data.configurations.globalConfiguration.find(
          (config: GlobalConfiguration) => config.name === 'report-export-s3-folder-name'
        );

        if (
          amazonS3Config &&
          amazonS3Config.enabled &&
          reportExportS3Config &&
          reportExportS3Config.enabled &&
          reportExportS3Config.stringValue
        ) {
          this.exportToS3Allowed = true;
          this.exportToS3Repository = reportExportS3Config.stringValue;
        }
      }
    });
  }

  isTableReport(): boolean {
    return this.report.type === 'Table';
  }

  isPentahoReport(): boolean {
    return this.report.type === 'Pentaho';
  }

  /**
   * Creates and sets the run report form.
   */
  ngOnInit() {
    this.maxDate = this.settingsService.maxAllowedDate;
    this.createRunReportForm();
  }

  /**
   * Establishes form controls for Report Parameter's name attribute,
   * Fetches dropdown options and builds child dependencies.
   */
  createRunReportForm() {
    this.paramData.forEach((param: ReportParameter) => {
      if (!param.parentParameterName) {
        // Non Child Parameter
        if (param.displayType === 'multiselect') {
          this.reportForm.addControl(
            param.name,
            new UntypedFormControl(
              [],
              [
                (control: AbstractControl) =>
                  Array.isArray(control.value) && control.value.length > 0 ? null : { required: true }

              ]
            )
          );
        } else {
          this.reportForm.addControl(param.name, new UntypedFormControl('', Validators.required));
        }
        if (param.displayType === 'select' || param.displayType === 'multiselect') {
          this.fetchSelectOptions(param, param.name);
        }
      } else {
        // Child Parameter
        const parent: ReportParameter = this.paramData.find((entry: any) => entry.name === param.parentParameterName);
        if (parent != null) {
          parent.childParameters.push(param);
          this.updateParentParameters(parent);
        }
      }
    });
    if (this.isPentahoReport()) {
      this.reportForm.addControl('outputType', new UntypedFormControl('', Validators.required));
      this.outputTypeOptions = [
        { name: 'PDF format', value: 'PDF' },
        { name: 'Normal format', value: 'HTML' },
        { name: 'Excel format', value: 'XLS' },
        { name: 'Excel 2007 format', value: 'XLSX' },
        { name: 'CSV format', value: 'CSV' }
      ];
      this.mapPentahoParams();
    }
    if (this.exportToS3Allowed) {
      this.reportForm.addControl('exportOutputToS3', new UntypedFormControl(false));
    }
    this.decimalChoice.patchValue('0');
    this.setChildControls();
    this.resolveDateRangeParams();
    this.addDateRangeValidator();
  }

  /**
   * Resolves and caches start/end date parameters; watches for manual edits to clear preset selection.
   */
  resolveDateRangeParams(): void {
    const dateParams = this.paramData.filter((param: ReportParameter) => param.displayType === 'date');
    this.startDateParam = dateParams.find((param: ReportParameter) => this.isStartDateParam(param)) ?? null;
    this.endDateParam = dateParams.find((param: ReportParameter) => this.isEndDateParam(param)) ?? null;

    if (!this.startDateParam || !this.endDateParam) {
      return;
    }

    const startControl = this.reportForm.get(this.startDateParam.name);
    const endControl = this.reportForm.get(this.endDateParam.name);
    if (!startControl || !endControl) {
      return;
    }

    this.buildYearMonthOptions();

    const clearSelectedPreset = () => {
      if (!this.applyingDateRangePreset) {
        this.selectedDateRangePreset = null;
        this.selectedYearMonth = null;
      }
    };
    startControl.valueChanges.subscribe(clearSelectedPreset);
    endControl.valueChanges.subscribe(clearSelectedPreset);

    const currentMonth = moment().format('YYYY-MM');
    const defaultMonth =
      this.yearMonthOptions.find((option) => option.value === currentMonth)?.value ?? this.yearMonthOptions[0]?.value;
    if (defaultMonth) {
      this.applyYearMonth(defaultMonth, false);
    }
  }

  /**
   * Builds year-month dropdown options from minDate through the current month (clamped to maxDate).
   */
  private buildYearMonthOptions(): void {
    const start = moment(this.minDate).startOf('month');
    const end = moment(Math.min(moment().valueOf(), moment(this.maxDate).valueOf())).startOf('month');
    const options: { value: string; label: string }[] = [];
    const cursor = start.clone();

    while (!cursor.isAfter(end, 'month')) {
      options.push({
        value: cursor.format('YYYY-MM'),
        label: cursor.format('MMMM YYYY')
      });
      cursor.add(1, 'month');
    }

    this.yearMonthOptions = options.reverse();
  }

  /**
   * Applies a selected year-month to the start and end date form controls.
   * @param {string} yearMonth Value in `YYYY-MM` form.
   * @param {boolean} markDirty Whether to mark controls dirty/touched.
   */
  applyYearMonth(yearMonth: string, markDirty = true): void {
    if (!yearMonth || !this.startDateParam || !this.endDateParam) {
      return;
    }

    const startControl = this.reportForm.get(this.startDateParam.name);
    const endControl = this.reportForm.get(this.endDateParam.name);
    if (!startControl || !endControl) {
      return;
    }

    const month = moment(yearMonth, 'YYYY-MM');
    const range = {
      start: this.clampDate(month.clone().startOf('month').startOf('day').toDate()),
      end: this.clampDate(month.clone().endOf('month').startOf('day').toDate())
    };

    this.applyingDateRangePreset = true;
    this.selectedYearMonth = yearMonth;
    this.selectedDateRangePreset = null;
    startControl.setValue(range.start);
    endControl.setValue(range.end);
    if (markDirty) {
      startControl.markAsDirty();
      startControl.markAsTouched();
      endControl.markAsDirty();
      endControl.markAsTouched();
    }
    this.applyingDateRangePreset = false;
  }

  /**
   * Applies a calendar date-range preset to the start and end date form controls.
   * @param {DateRangePresetId} id Preset identifier.
   */
  applyDateRangePreset(id: DateRangePresetId): void {
    if (!this.startDateParam || !this.endDateParam) {
      return;
    }

    const startControl = this.reportForm.get(this.startDateParam.name);
    const endControl = this.reportForm.get(this.endDateParam.name);
    if (!startControl || !endControl) {
      return;
    }

    const range = this.getDateRangeForPreset(id);
    this.applyingDateRangePreset = true;
    this.selectedDateRangePreset = id;
    this.selectedYearMonth = null;
    startControl.setValue(range.start);
    endControl.setValue(range.end);
    startControl.markAsDirty();
    startControl.markAsTouched();
    endControl.markAsDirty();
    endControl.markAsTouched();
    this.applyingDateRangePreset = false;
  }

  /**
   * Computes start/end dates for a preset, clamped to min/max allowed dates.
   * @param {DateRangePresetId} id Preset identifier.
   */
  private getDateRangeForPreset(id: DateRangePresetId): { start: Date; end: Date } {
    let start = moment();
    let end = moment();

    switch (id) {
      case 'thisQuarter':
        start = moment().startOf('quarter');
        end = moment().endOf('quarter');
        break;
      case 'lastQuarter':
        start = moment().subtract(1, 'quarter').startOf('quarter');
        end = moment().subtract(1, 'quarter').endOf('quarter');
        break;
      case 'thisYear':
        start = moment().startOf('year');
        end = moment().endOf('year');
        break;
      case 'lastYear':
        start = moment().subtract(1, 'year').startOf('year');
        end = moment().subtract(1, 'year').endOf('year');
        break;
    }

    return {
      start: this.clampDate(start.startOf('day').toDate()),
      end: this.clampDate(end.startOf('day').toDate())
    };
  }

  /**
   * Clamps a date into the allowed min/max range for the datepickers.
   * @param {Date} date Date to clamp.
   */
  private clampDate(date: Date): Date {
    const time = date.getTime();
    if (time < this.minDate.getTime()) {
      return new Date(this.minDate);
    }
    if (time > this.maxDate.getTime()) {
      return new Date(this.maxDate);
    }
    return date;
  }

  /**
   * Updates the array of parent parameters.
   * @param {ReportParameter} parent Parent report parameter
   */
  updateParentParameters(parent: ReportParameter) {
    const parentNames = this.parentParameters.map((parameter) => parameter.name);
    if (!parentNames.includes(parent.name)) {
      // Parent's first child.
      this.parentParameters.push(parent);
    } else {
      // Parent already has a child
      const index = parentNames.indexOf(parent.name);
      this.parentParameters[index] = parent;
    }
  }

  /**
   * Maps pentaho specific names to form-control names.
   */
  mapPentahoParams() {
    this.reportsService.getPentahoParams(this.report.id).subscribe((data: any) => {
      data.forEach((entry: any) => {
        const param: ReportParameter = this.paramData.find((_entry: any) => _entry.name === entry.parameterName);
        param.pentahoName = `R_${entry.reportParameterName}`;
      });
    });
  }

  addDateRangeValidator(): void {
    if (!this.startDateParam || !this.endDateParam) {
      return;
    }

    const startControl = this.reportForm.get(this.startDateParam.name);
    const endControl = this.reportForm.get(this.endDateParam.name);

    if (!startControl || !endControl) {
      return;
    }

    endControl.addValidators(this.endDateAfterStartValidator(this.startDateParam.name));
    endControl.updateValueAndValidity({ emitEvent: false });
    startControl.valueChanges.subscribe(() => endControl.updateValueAndValidity({ emitEvent: false }));
  }

  endDateAfterStartValidator(startControlName: string): ValidatorFn {
    return (control: AbstractControl) => {
      const startControl = control.parent?.get(startControlName);
      const startValue = startControl?.value;
      const endValue = control.value;

      if (!startValue || !endValue) {
        return null;
      }

      const startDate = new Date(startValue);
      const endDate = new Date(endValue);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      if (endDate < startDate) {
        return { endBeforeStart: true };
      }

      return null;
    };
  }

  isStartDateParam(param: ReportParameter): boolean {
    const identifier = `${param.name}${param.variable}${param.label}`.toLowerCase();
    return identifier.includes('start') || identifier.includes('from');
  }

  isEndDateParam(param: ReportParameter): boolean {
    const identifier = `${param.name}${param.variable}${param.label}`.toLowerCase();
    return identifier.includes('end') || identifier.includes('to');
  }

  /**
   * Subscribes to changes in parent parameters value, builds child parameter vis-a-vis parent's value.
   */
  setChildControls() {
    this.parentParameters.forEach((param: ReportParameter) => {
      this.reportForm.get(param.name).valueChanges.subscribe((option: any) => {
        param.childParameters.forEach((child: ReportParameter) => {
          if (child.displayType === 'none') {
            this.reportForm.addControl(child.name, new UntypedFormControl(child.defaultVal));
          } else {
            this.reportForm.addControl(child.name, new UntypedFormControl('', Validators.required));
          }
          if (child.displayType === 'select') {
            const inputstring = `${child.name}?${param.inputName}=${option.id}`;
            this.fetchSelectOptions(child, inputstring);
          }
        });
      });
    });
  }

  /**
   * Fetches Select Dropdown options for param type "Select" / "multiselect".
   * When the parameter supports "All" (selectAll === 'Y'), that option is added and set as the default
   * (except loanStatusId multiselect defaults to Active / 300 when available).
   * @param {ReportParameter} param Parameter for which dropdown options are required.
   * @param {string} inputstring url substring for API call.
   */
  fetchSelectOptions(param: ReportParameter, inputstring: string) {
    this.reportsService.getSelectOptions(inputstring).subscribe((options: SelectOption[]) => {
      param.selectOptions = options;
      const allOption = { id: -1, name: 'All' } as SelectOption;
      if (param.selectAll === 'Y') {
        param.selectOptions = [
          allOption,
          ...param.selectOptions
        ];
      }

      if (param.displayType === 'multiselect') {
        if (param.variable === 'loanStatusId') {
          const active = param.selectOptions.find((option) => String(option.id) === '300');
          this.reportForm.get(param.name)?.patchValue(active ? [active] : param.selectAll === 'Y' ? [allOption] : []);
        } else if (param.selectAll === 'Y') {
          this.reportForm.get(param.name)?.patchValue([allOption]);
        }
      } else if (param.selectAll === 'Y') {
        this.reportForm.get(param.name)?.patchValue(allOption);
      }
    });
  }

  /** Compare mat-select options by id so multiselect patching works after options load. */
  compareSelectOptions = (a: SelectOption | null, b: SelectOption | null): boolean => {
    if (a == null || b == null) {
      return a === b;
    }
    return String(a.id) === String(b.id);
  };

  /**
   * Formats user response and readies it for utilization by run report function.
   * @param {any} response Object containing formcontrol values.
   */
  formatUserResponse(response: any) {
    const formattedResponse: any = {};
    let newKey: string;
    this.reportToBeExportedInRepository = false;
    for (const [
      key,
      value
    ] of Object.entries(response)) {
      if (key === 'outputType') {
        formattedResponse['output-type'] = value;
        continue;
      } else if (key === 'exportOutputToS3') {
        this.reportToBeExportedInRepository = value;
        continue;
      }

      const param: ReportParameter = this.paramData.find((_entry: any) => _entry.name === key);
      if (!param) {
        continue;
      }
      newKey = this.isPentahoReport() ? param.pentahoName : param.inputName;
      switch (param.displayType) {
        case 'text':
          formattedResponse[newKey] = value;
          break;
        case 'select': {
          const option = value as { id?: string | number } | null | undefined;
          const id = option != null && option.id != null ? String(option.id) : null;
          // Avoid sending undefined to backend (causes SQL/DataIntegrityViolation). Use -1 for "All" when param supports it and value is empty.
          formattedResponse[newKey] = id ?? (param.selectAll === 'Y' ? '-1' : '');
          break;
        }
        case 'multiselect': {
          const options = (Array.isArray(value) ? value : []) as { id?: string | number }[];
          if (options.length === 0) {
            formattedResponse[newKey] = param.selectAll === 'Y' ? '-1' : '';
          } else if (options.some((option) => String(option.id) === '-1')) {
            formattedResponse[newKey] = '-1';
          } else {
            formattedResponse[newKey] = options.map((option) => String(option.id)).join(',');
          }
          break;
        }
        case 'date':
          if (this.isTableReport()) {
            formattedResponse[newKey] = this.dateUtils.formatDate(value, Dates.DEFAULT_DATEFORMAT);
          } else {
            formattedResponse[newKey] = this.dateUtils.formatDate(value, this.settingsService.dateFormat);
          }
          this.reportUsesDates = true;
          break;
        case 'none':
          formattedResponse[newKey] = value;
          break;
      }
    }
    return formattedResponse;
  }

  /**
   * Core run report functionality.
   */
  run() {
    this.isCollapsed = true;
    const userResponseValues = this.formatUserResponse(this.reportForm.value);
    let formData = {
      ...userResponseValues
    };
    if (this.reportUsesDates) {
      let dateFormat = this.settingsService.dateFormat;
      if (this.isTableReport()) {
        dateFormat = Dates.DEFAULT_DATEFORMAT;
      }
      formData = {
        ...userResponseValues,
        locale: this.settingsService.language.code,
        dateFormat: dateFormat
      };
    }
    if (this.reportToBeExportedInRepository) {
      formData['exportS3'] = true;
    }
    this.dataObject = {
      formData: formData,
      report: this.report,
      decimalChoice: this.decimalChoice.value
    };
    switch (this.report.type) {
      case 'SMS':
      case 'Table':
        this.hideTable = false;
        break;
      case 'Chart':
        this.hideChart = false;
        break;
      case 'Pentaho':
        this.hidePentaho = false;
        break;
    }
  }

  runReportAndExport($event: Event): void {
    $event.stopPropagation();
    this.isProcessing = true;
    const userResponseValues = this.formatUserResponse(this.reportForm.value);

    const reportName = this.report.name;
    const payload = {
      ...userResponseValues,
      decimalChoice: this.decimalChoice.value
      // exportCSV: true
    };
    this.reportsService.getRunReportData(reportName, payload).subscribe((res: any) => {
      if (res.data.length > 0) {
        this.alertService.alert({ type: 'Report generation', message: `Report: ${reportName} data generated` });

        const displayedColumns: string[] = [];
        res.columnHeaders.forEach((header: any) => {
          displayedColumns.push(header.columnName);
        });

        this.exportToXLS(reportName, res.data, displayedColumns, userResponseValues);
      } else {
        this.alertService.alert({ type: 'Report generation', message: `Report: ${reportName} without data generated` });
      }
      this.isProcessing = false;
    });
  }

  async exportToXLS(
    reportName: string,
    csvData: any,
    displayedColumns: string[],
    formData?: Record<string, any>
  ): Promise<void> {
    if (isReporteBcr(reportName)) {
      const buffer = await buildReporteBcrWorkbook({
        columns: displayedColumns,
        rows: csvData,
        metadata: resolveReporteBcrMetadata(this.paramData, this.reportForm.getRawValue())
      });
      downloadBlob(buffer, 'REPORTE_BCR.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return;
    }

    if (isReporteSeguro(reportName)) {
      const period = resolveReportPeriodDates(formData);
      const buffer = await buildReporteSeguroWorkbook({
        columns: displayedColumns,
        rows: csvData,
        startDate: period.startDate,
        endDate: period.endDate
      });
      downloadBlob(buffer, 'REPORTE_SEGURO.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return;
    }

    const fileName = `${reportName}.xlsx`;

    // Format data for ExcelJS
    const data = csvData.map((object: any) => {
      const row: Record<string, any> = {};
      for (let i = 0; i < displayedColumns.length; i++) {
        row[displayedColumns[i]] = object.row[i];
      }
      return row;
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('report');

    // Add header
    worksheet.addRow(displayedColumns);

    // Add data rows
    data.forEach((rowObj: any) => {
      worksheet.addRow(displayedColumns.map((col) => rowObj[col]));
    });

    // Write to buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(buffer, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
}
