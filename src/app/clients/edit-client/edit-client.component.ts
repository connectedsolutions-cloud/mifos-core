/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  ReactiveFormsModule
} from '@angular/forms';

/** Custom Services */
import { ClientsService } from '../clients.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { Datatables } from 'app/core/utils/datatables';
import { MatDivider } from '@angular/material/divider';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatCheckbox } from '@angular/material/checkbox';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import {
  CREDESAL_ALLOWED_CLIENT_TYPE_TAG_NAMES,
  CREDESAL_ALLOWED_SHAREHOLDER_TYPE_TAG_NAMES,
  CREDESAL_CLIENT_TYPE_RESTRICTED_DATATABLE_NAMES,
  CREDESAL_WORK_BUSINESS_DATATABLE_NAME
} from '../clients-view/credesal-client-data-datatables';

/**
 * Edit Client Component
 */
@Component({
  selector: 'mifosx-edit-client',
  templateUrl: './edit-client.component.html',
  styleUrls: ['./edit-client.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDivider,
    CdkTextareaAutosize,
    MatCheckbox
  ]
})
export class EditClientComponent implements OnInit {
  private readonly personalDatatableName = 'credesal_client_datos_personales';
  private readonly workBusinessDatatableName = CREDESAL_WORK_BUSINESS_DATATABLE_NAME;
  private readonly clientTypeRestrictedDatatableNames = CREDESAL_CLIENT_TYPE_RESTRICTED_DATATABLE_NAMES;
  private readonly allowedClientTypeTagNames = CREDESAL_ALLOWED_CLIENT_TYPE_TAG_NAMES;
  private readonly allowedShareholderTagNames = CREDESAL_ALLOWED_SHAREHOLDER_TYPE_TAG_NAMES;
  /** Minimum date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum date allowed. */
  maxDate = new Date();

  /** Client Data and Template */
  clientDataAndTemplate: any;
  /** Edit Client Form */
  editClientForm: UntypedFormGroup;

  /** Office Options */
  officeOptions: any;
  /** Staff Options */
  staffOptions: any;
  /** Gestor Options */
  gestorOptions: any;
  /** Legal Form Options */
  legalFormOptions: any;
  /** Client Type Options */
  clientTypeOptions: any;
  /** Client Classification Options */
  clientClassificationTypeOptions: any;
  /** Business Line Options */
  businessLineOptions: any;
  /** Constitution Options */
  constitutionOptions: any;
  /** Gender Options */
  genderOptions: any;
  /** Tag Options */
  tagOptions: any;
  personalDetailsDatatable: any;
  datatables: any[] = [];
  personalDatatableInputs: any[] = [];
  extraDatatableSections: Array<{ datatable: any; inputs: any[]; prefix: string }> = [];
  private datatablesWithExistingRows = new Set<string>();
  legalFormId = 1;

  /**
   * Fetches client template data from `resolve`
   * @param {FormBuilder} formBuilder Form Builder
   * @param {ActivatedRoute} route ActivatedRoute
   * @param {Router} router Router
   * @param {ClientsService} clientsService Clients Service
   * @param {Dates} dateUtils Date Utils
   * @param {SettingsService} settingsService Settings Service
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService,
    private dateUtils: Dates,
    private settingsService: SettingsService,
    private datatableService: Datatables
  ) {
    this.route.data.subscribe((data: { clientDataAndTemplate: any }) => {
      this.clientDataAndTemplate = data.clientDataAndTemplate;
    });
  }

  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.createEditClientForm();
    this.setOptions();
    this.buildDependencies();
    this.setupShareholderTagDependency();
    this.legalFormId = this.clientDataAndTemplate.legalForm?.id || 1;
    this.setDatatables();
    this.setupDatatableControls();
    this.debugDatatablePayload('initial');

    // Check if tags is a Set and convert to array if needed
    let tagsArray: any[] = [];
    if (this.clientDataAndTemplate.tags) {
      if (Array.isArray(this.clientDataAndTemplate.tags)) {
        tagsArray = this.clientDataAndTemplate.tags;
      } else if (this.clientDataAndTemplate.tags instanceof Set) {
        tagsArray = Array.from(this.clientDataAndTemplate.tags);
      } else {
        // Try to convert to array
        tagsArray = Object.values(this.clientDataAndTemplate.tags);
      }
    }

    const filteredTags = tagsArray.filter((tag: any) => {
      return tag.tagGroup === 'tipo_cliente';
    });
    const tagIds = filteredTags.map((tag: any) => {
      const id = typeof tag.id === 'string' ? Number(tag.id) : tag.id;
      return id;
    });

    this.editClientForm.patchValue({
      officeId: this.clientDataAndTemplate.officeId,
      staffId: this.clientDataAndTemplate.staffId,
      gestorId: this.clientDataAndTemplate.gestorId,
      legalFormId: this.clientDataAndTemplate.legalForm && this.clientDataAndTemplate.legalForm.id,
      accountNo: this.clientDataAndTemplate.accountNo,
      externalId: this.clientDataAndTemplate.externalId,
      genderId: this.clientDataAndTemplate.gender && this.clientDataAndTemplate.gender.id,
      isStaff: this.clientDataAndTemplate.isStaff,
      active: this.clientDataAndTemplate.active,
      mobileNo: this.clientDataAndTemplate.mobileNo,
      emailAddress: this.clientDataAndTemplate.emailAddress,
      dateOfBirth: this.clientDataAndTemplate.dateOfBirth && new Date(this.clientDataAndTemplate.dateOfBirth),
      clientTypeId: this.clientDataAndTemplate.clientType && this.clientDataAndTemplate.clientType.id,
      clientClassificationId:
        this.clientDataAndTemplate.clientClassification && this.clientDataAndTemplate.clientClassification.id,
      submittedOnDate:
        this.clientDataAndTemplate.timeline.submittedOnDate &&
        new Date(this.clientDataAndTemplate.timeline.submittedOnDate),
      activationDate:
        this.clientDataAndTemplate.timeline.activatedOnDate &&
        new Date(this.clientDataAndTemplate.timeline.activatedOnDate),
      tagIds: tagIds
    });
    if (this.clientDataAndTemplate.legalForm) {
      this.legalFormId = this.clientDataAndTemplate.legalForm.id;
    }
    this.loadExistingDatatableValues();
  }

  /**
   * Creates the edit client form.
   */
  createEditClientForm() {
    this.editClientForm = this.formBuilder.group({
      officeId: [{ value: '', disabled: true }],
      staffId: [''],
      gestorId: [''],
      legalFormId: [{ value: '', disabled: true }],
      isStaff: [false],
      active: [false],
      accountNo: [{ value: '', disabled: true }],
      externalId: [''],
      genderId: [''],
      mobileNo: [''],
      emailAddress: [
        '',
        Validators.email
      ],
      dateOfBirth: [''],
      clientTypeId: [''],
      clientClassificationId: [''],
      submittedOnDate: [
        '',
        Validators.required
      ],
      activationDate: [''],
      tagIds: []
    });
  }

  /**
   * Sets select dropdown options.
   */
  setOptions() {
    this.officeOptions = this.clientDataAndTemplate.officeOptions;
    this.staffOptions = this.clientDataAndTemplate.staffOptions;
    this.gestorOptions = this.clientDataAndTemplate.staffOptions;
    this.legalFormOptions = this.clientDataAndTemplate.clientLegalFormOptions;
    this.clientTypeOptions = this.clientDataAndTemplate.clientTypeOptions;
    this.clientClassificationTypeOptions = this.clientDataAndTemplate.clientClassificationOptions;
    this.businessLineOptions = this.clientDataAndTemplate.clientNonPersonMainBusinessLineOptions;
    this.constitutionOptions = this.clientDataAndTemplate.clientNonPersonConstitutionOptions;
    this.genderOptions = this.clientDataAndTemplate.genderOptions;
    this.tagOptions = this.clientDataAndTemplate.tagOptions || [];
  }

  /**
   * Adds controls conditionally.
   */
  buildDependencies() {
    this.editClientForm.get('legalFormId').valueChanges.subscribe((legalFormId: any) => {
      this.legalFormId = legalFormId;
      if (legalFormId === 1) {
        this.editClientForm.removeControl('fullname');
        this.editClientForm.removeControl('clientNonPersonDetails');
        this.editClientForm.addControl(
          'firstname',
          new UntypedFormControl(this.clientDataAndTemplate.firstname, Validators.required)
        );
        this.editClientForm.addControl('middlename', new UntypedFormControl(this.clientDataAndTemplate.middlename));
        this.editClientForm.addControl(
          'lastname',
          new UntypedFormControl(this.clientDataAndTemplate.lastname, Validators.required)
        );
      } else {
        this.editClientForm.removeControl('firstname');
        this.editClientForm.removeControl('middlename');
        this.editClientForm.removeControl('lastname');
        this.editClientForm.addControl(
          'fullname',
          new UntypedFormControl(this.clientDataAndTemplate.fullname, Validators.required)
        );
        this.editClientForm.addControl(
          'clientNonPersonDetails',
          this.formBuilder.group({
            constitutionId: [
              this.clientDataAndTemplate.clientNonPersonDetails.constitution &&
                this.clientDataAndTemplate.clientNonPersonDetails.constitution.id,
              Validators.required
            ],
            incorpValidityTillDate: [
              this.clientDataAndTemplate.clientNonPersonDetails.incorpValidityTillDate &&
                new Date(this.clientDataAndTemplate.clientNonPersonDetails.incorpValidityTillDate)],
            incorpNumber: [this.clientDataAndTemplate.clientNonPersonDetails.incorpNumber],
            mainBusinessLineId: [
              this.clientDataAndTemplate.clientNonPersonDetails.mainBusinessLine &&
                this.clientDataAndTemplate.clientNonPersonDetails.mainBusinessLine.id
            ],
            remarks: [this.clientDataAndTemplate.clientNonPersonDetails.remarks]
          })
        );
      }
      this.setDatatables();
      this.setupDatatableControls();
      this.debugDatatablePayload('legal-form-change');
      this.loadExistingDatatableValues();
    });
  }

  setupShareholderTagDependency(): void {
    this.editClientForm.get('tagIds')?.valueChanges.subscribe(() => {
      this.setDatatables();
      this.setupDatatableControls();
      this.loadExistingDatatableValues();
    });
  }

  getDateLabel(legalFormId: number, values: string[]): string {
    return legalFormId === 1 ? values[0] : values[1];
  }

  /**
   * Submits the edit client form.
   */
  submit() {
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const editClientFormValue: any = this.editClientForm.getRawValue();
    Object.keys(editClientFormValue).forEach((key) => {
      if (key.startsWith('personalDt_') || key.startsWith('dt_')) {
        delete editClientFormValue[key];
      }
    });
    const clientData = {
      ...editClientFormValue,
      dateOfBirth:
        editClientFormValue.dateOfBirth && this.dateUtils.formatDate(editClientFormValue.dateOfBirth, dateFormat),
      submittedOnDate:
        editClientFormValue.submittedOnDate &&
        this.dateUtils.formatDate(editClientFormValue.submittedOnDate, dateFormat),
      activationDate: this.dateUtils.formatDate(editClientFormValue.activationDate, dateFormat),
      dateFormat,
      locale
    };
    delete clientData.officeId;
    if (editClientFormValue.clientNonPersonDetails) {
      clientData.clientNonPersonDetails = {
        ...editClientFormValue.clientNonPersonDetails,
        incorpValidityTillDate:
          editClientFormValue.clientNonPersonDetails.incorpValidityTillDate &&
          this.dateUtils.formatDate(editClientFormValue.clientNonPersonDetails.incorpValidityTillDate, dateFormat),
        dateFormat,
        locale
      };
    } else {
      clientData.clientNonPersonDetails = {};
    }
    const datatablesPayload = this.getDatatablesPayload();
    this.clientsService
      .updateClient(this.clientDataAndTemplate.id, clientData)
      .pipe(switchMap(() => this.saveDatatables(this.clientDataAndTemplate.id, datatablesPayload)))
      .subscribe(() => {
        this.router.navigate(['../'], { relativeTo: this.route });
      });
  }

  private saveDatatables(clientId: string, datatablesPayload: any[]) {
    if (!datatablesPayload.length) {
      return of(null);
    }
    const requests = datatablesPayload.map((datatable) => {
      const datatableName = datatable.registeredTableName;
      const data = datatable.data;
      const hasExistingRow = this.datatablesWithExistingRows.has(datatableName);
      const hasMeaningfulValues = this.hasMeaningfulDatatableValues(data);

      if (!hasExistingRow && !hasMeaningfulValues) {
        return of(null);
      }

      if (hasExistingRow) {
        return this.clientsService.editClientDatatableEntry(clientId, datatableName, data);
      }

      return this.clientsService.editClientDatatableEntry(clientId, datatableName, data).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error?.status === 404) {
            return this.clientsService.addClientDatatableEntry(clientId, datatableName, data);
          }
          throw error;
        })
      );
    });
    return forkJoin(requests);
  }

  private hasMeaningfulDatatableValues(data: any): boolean {
    return Object.keys(data || {}).some((key) => {
      if (key === 'locale' || key === 'dateFormat') {
        return false;
      }
      const value = data[key];
      if (value === null || value === undefined || value === '') {
        return false;
      }
      // Avoid creating new datatable rows from untouched checkbox/numeric defaults.
      if (value === false || value === 0) {
        return false;
      }
      return true;
    });
  }

  setDatatables(): void {
    this.datatables = [];
    this.personalDetailsDatatable = null;
    const legalFormTypeVal = this.legalFormId === 2 ? 'entity' : 'person';
    if (!this.clientDataAndTemplate?.datatables?.length) {
      return;
    }
    this.clientDataAndTemplate.datatables.forEach((datatable: any) => {
      const subType = datatable.entitySubType?.toLowerCase();
      // Keep legal-form filtering, but include datatables that don't declare entitySubType
      // so users can always see and fill all configured input fields.
      if ((!subType || subType === legalFormTypeVal) && this.shouldDisplayDatatable(datatable.registeredTableName)) {
        if (datatable.registeredTableName === this.personalDatatableName) {
          this.personalDetailsDatatable = datatable;
          return;
        }
        this.datatables.push(datatable);
      }
    });
  }

  private shouldDisplayDatatable(registeredTableName: string): boolean {
    if (registeredTableName === this.workBusinessDatatableName) {
      return this.isAnyAllowedTypeSelected(this.allowedShareholderTagNames);
    }
    if (!this.clientTypeRestrictedDatatableNames.has(registeredTableName)) {
      return true;
    }
    return this.isAnyAllowedTypeSelected(this.allowedClientTypeTagNames);
  }

  private isAnyAllowedTypeSelected(allowedTagNames: Set<string>): boolean {
    const selectedTagIds: Array<number | string> = this.editClientForm?.get('tagIds')?.value || [];
    if (!Array.isArray(selectedTagIds) || !selectedTagIds.length) {
      return false;
    }
    const selectedTagIdSet = new Set(selectedTagIds.map((id) => String(id)));

    const selectedTags = (this.tagOptions || []).filter((tag: any) => selectedTagIdSet.has(String(tag.id)));
    return selectedTags.some((tag: any) => allowedTagNames.has(this.normalizeTagName(tag?.name)));
  }

  private normalizeTagName(name: string): string {
    return (name || '').toLowerCase().trim();
  }

  setupDatatableControls(): void {
    this.removeExistingDatatableControls();
    this.personalDatatableInputs = [];
    this.extraDatatableSections = [];
    this.setupPersonalDatatableControls();
    this.setupAdditionalDatatableControls();
  }

  removeExistingDatatableControls(): void {
    Object.keys(this.editClientForm.controls)
      .filter((controlName) => controlName.startsWith('personalDt_') || controlName.startsWith('dt_'))
      .forEach((controlName) => this.editClientForm.removeControl(controlName));
  }

  setupPersonalDatatableControls(): void {
    if (!this.personalDetailsDatatable?.columnHeaderData?.length) {
      return;
    }
    const inputs = this.datatableService.filterSystemColumns(this.personalDetailsDatatable.columnHeaderData);
    this.personalDatatableInputs = inputs.map((input: any) => {
      const controlName = this.datatableService.getInputName(input);
      const formControlName = `personalDt_${controlName}`;
      this.addDatatableControl(formControlName, input);
      return {
        ...input,
        controlName,
        formControlName
      };
    });
  }

  setupAdditionalDatatableControls(): void {
    this.datatables.forEach((datatable: any, index: number) => {
      const sectionPrefix = `dt_${index}_`;
      const inputs = this.datatableService.filterSystemColumns(datatable.columnHeaderData).map((input: any) => {
        const controlName = this.datatableService.getInputName(input);
        const formControlName = `${sectionPrefix}${controlName}`;
        this.addDatatableControl(formControlName, input);
        return {
          ...input,
          controlName,
          formControlName
        };
      });
      this.extraDatatableSections.push({
        datatable,
        inputs,
        prefix: sectionPrefix
      });
    });
  }

  addDatatableControl(formControlName: string, input: any): void {
    const validators = input.isColumnNullable ? [] : [Validators.required];
    const defaultValue = !input.isColumnNullable && this.isNumeric(input.columnDisplayType) ? 0 : '';
    if (!this.editClientForm.contains(formControlName)) {
      this.editClientForm.addControl(formControlName, new UntypedFormControl(defaultValue, validators));
    }
  }

  loadExistingDatatableValues(): void {
    this.datatablesWithExistingRows.clear();
    const requests = [
      this.personalDetailsDatatable,
      ...this.datatables
    ]
      .filter((datatable) => !!datatable?.registeredTableName)
      .map((datatable) =>
        this.clientsService
          .getClientDatatable(this.clientDataAndTemplate.id, datatable.registeredTableName, {
            skipErrorHandler: true
          })
          .pipe(catchError(() => of(null)))
      );
    if (!requests.length) {
      return;
    }
    forkJoin(requests).subscribe((datatableRows: any[]) => {
      datatableRows.forEach((datatableResponse: any, idx: number) => {
        if (!datatableResponse?.columnHeaders || !datatableResponse?.data?.length) {
          return;
        }
        const isPersonal = idx === 0 && !!this.personalDetailsDatatable;
        const datatableName = isPersonal
          ? this.personalDetailsDatatable?.registeredTableName
          : this.datatables[this.personalDetailsDatatable ? idx - 1 : idx]?.registeredTableName;
        if (datatableName) {
          this.datatablesWithExistingRows.add(datatableName);
        }
        const filteredColumns = this.datatableService.filterSystemColumns(datatableResponse.columnHeaders);
        const row = datatableResponse.data[0]?.row || [];
        const sectionIndex = this.personalDetailsDatatable ? idx - 1 : idx;
        filteredColumns.forEach((column: any) => {
          const controlName = this.datatableService.getInputName(column);
          const formControlName = isPersonal ? `personalDt_${controlName}` : `dt_${sectionIndex}_${controlName}`;
          if (!this.editClientForm.contains(formControlName)) {
            return;
          }
          const value = row[column.idx];
          if (value === null || value === undefined || value === '') {
            return;
          }
          if (this.isDate(column.columnDisplayType)) {
            this.editClientForm.get(formControlName)?.setValue(this.dateUtils.parseDate(value));
          } else {
            this.editClientForm.get(formControlName)?.setValue(value);
          }
        });
      });
    });
  }

  getDatatablesPayload(): any[] {
    const payload: any[] = [];
    if (this.personalDetailsDatatable && this.personalDatatableInputs.length) {
      const personalValues: any = {};
      this.personalDatatableInputs.forEach((input: any) => {
        personalValues[input.controlName] = this.editClientForm.get(input.formControlName)?.value;
      });
      payload.push({
        registeredTableName: this.personalDetailsDatatable.registeredTableName,
        data: this.datatableService.buildPayload(
          this.personalDatatableInputs,
          personalValues,
          this.settingsService.dateFormat,
          {
            locale: this.settingsService.language.code
          }
        )
      });
    }

    this.extraDatatableSections.forEach((section) => {
      const values: any = {};
      section.inputs.forEach((input: any) => {
        values[input.controlName] = this.editClientForm.get(input.formControlName)?.value;
      });
      payload.push({
        registeredTableName: section.datatable.registeredTableName,
        data: this.datatableService.buildPayload(section.inputs, values, this.settingsService.dateFormat, {
          locale: this.settingsService.language.code
        })
      });
    });

    return payload;
  }

  isNumeric(columnType: string) {
    return this.datatableService.isNumeric(columnType);
  }

  isDate(columnType: string) {
    return this.datatableService.isDate(columnType);
  }

  isBoolean(columnType: string) {
    return this.datatableService.isBoolean(columnType);
  }

  isDropdown(columnType: string) {
    return this.datatableService.isDropdown(columnType);
  }

  isString(columnType: string) {
    return this.datatableService.isString(columnType);
  }

  isText(columnType: string) {
    return this.datatableService.isText(columnType);
  }

  private debugDatatablePayload(context: string): void {
    const templateDatatables = this.clientDataAndTemplate?.datatables || [];
    // Temporary diagnostics to confirm backend payload used to render edit form.
    console.info('[EditClient datatables]', {
      context,
      clientId: this.clientDataAndTemplate?.id,
      legalFormId: this.legalFormId,
      templateDatatablesCount: templateDatatables.length,
      templateDatatables: templateDatatables.map((dt: any) => ({
        name: dt.registeredTableName,
        entitySubType: dt.entitySubType,
        columnsCount: dt.columnHeaderData?.length || 0
      })),
      personalDatatable: this.personalDetailsDatatable?.registeredTableName || null,
      personalInputsCount: this.personalDatatableInputs.length,
      extraSectionsCount: this.extraDatatableSections.length
    });
  }
}
