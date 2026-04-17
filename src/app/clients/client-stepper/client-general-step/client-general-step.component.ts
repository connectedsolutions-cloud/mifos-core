/** Angular Imports */
import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { ClientsService } from 'app/clients/clients.service';
import { Dates } from 'app/core/utils/dates';
import { Datatables } from 'app/core/utils/datatables';

/** Custom Services */
import { SettingsService } from 'app/settings/settings.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { MatDivider } from '@angular/material/divider';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Create Client Component
 */
@Component({
  selector: 'mifosx-client-general-step',
  templateUrl: './client-general-step.component.html',
  styleUrls: ['./client-general-step.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDivider,
    CdkTextareaAutosize,
    MatCheckbox,
    MatStepperPrevious,
    FaIconComponent,
    MatStepperNext
  ]
})
export class ClientGeneralStepComponent implements OnInit, OnChanges {
  @Output() legalFormChangeEvent = new EventEmitter<{ legalForm: number }>();

  /** Minimum date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum date allowed. */
  maxDate = new Date();

  /** Client Template */
  @Input() clientTemplate: any;
  @Input() personalDetailsDatatable: any;
  /** Create Client Form */
  createClientForm: UntypedFormGroup;
  personalDatatableInputs: any[] = [];

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
  /** Saving Product Options */
  savingProductOptions: any;
  /** Tag Options */
  tagOptions: any;
  /** Whether user has permission to activate clients on create */
  canActivateOnCreate = false;

  /**
   * @param {FormBuilder} formBuilder Form Builder
   * @param {Dates} dateUtils Date Utils
   * @param {SettingsService} settingsService Setting service
   * @param {ClientsService} clientService Client service
   * @param {AuthenticationService} authenticationService Authentication service
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private dateUtils: Dates,
    private settingsService: SettingsService,
    private clientService: ClientsService,
    private authenticationService: AuthenticationService,
    private datatableService: Datatables
  ) {
    this.setClientForm();
    this.checkPermission();
  }

  /**
   * Checks if user has permission to activate clients on create
   */
  checkPermission() {
    const credentials = this.authenticationService.getCredentials();
    if (credentials?.permissions) {
      this.canActivateOnCreate = credentials.permissions.includes('ACTIVATE_CLIENT_ON_CREATE');
    }
  }

  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.setOptions();
    this.buildDependencies();
    this.setupPersonalDatatableControls();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.personalDetailsDatatable && this.createClientForm) {
      this.setupPersonalDatatableControls();
    }
  }

  setupPersonalDatatableControls() {
    this.personalDatatableInputs = [];
    Object.keys(this.createClientForm.controls)
      .filter((controlName) => controlName.startsWith('personalDt_'))
      .forEach((controlName) => this.createClientForm.removeControl(controlName));
    if (!this.personalDetailsDatatable?.columnHeaderData?.length) {
      return;
    }

    const datatableInputs = this.datatableService.filterSystemColumns(this.personalDetailsDatatable.columnHeaderData);
    datatableInputs.forEach((input: any) => {
      const controlName = this.datatableService.getInputName(input);
      const formControlName = `personalDt_${controlName}`;
      const defaultValue = !input.isColumnNullable && this.isNumeric(input.columnDisplayType) ? 0 : '';
      const validators = !input.isColumnNullable ? [Validators.required] : [];

      this.personalDatatableInputs.push({
        ...input,
        controlName,
        formControlName
      });
      if (!this.createClientForm.contains(formControlName)) {
        this.createClientForm.addControl(formControlName, new UntypedFormControl(defaultValue, validators));
      }
    });
  }

  /**
   * Creates the client form.
   */
  setClientForm() {
    this.createClientForm = this.formBuilder.group({
      officeId: [
        '',
        Validators.required
      ],
      staffId: [''],
      gestorId: [''],
      legalFormId: [
        '',
        Validators.required
      ],
      isStaff: [false],
      active: [false],
      addSavings: [false],
      accountNo: [''],
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
        this.settingsService.businessDate,
        Validators.required
      ],
      tagIds: []
    });
  }

  /**
   * Sets select dropdown options.
   */
  setOptions() {
    this.officeOptions = this.clientTemplate.officeOptions;
    this.staffOptions = this.clientTemplate.staffOptions;
    this.gestorOptions = this.clientTemplate.staffOptions;
    this.legalFormOptions = this.clientTemplate.clientLegalFormOptions;
    this.clientTypeOptions = this.clientTemplate.clientTypeOptions;
    this.clientClassificationTypeOptions = this.clientTemplate.clientClassificationOptions;
    this.businessLineOptions = this.clientTemplate.clientNonPersonMainBusinessLineOptions;
    this.constitutionOptions = this.clientTemplate.clientNonPersonConstitutionOptions;
    this.genderOptions = this.clientTemplate.genderOptions;
    this.savingProductOptions = this.clientTemplate.savingProductOptions;
    this.tagOptions = this.clientTemplate.tagOptions || [];
  }

  /**
   * Adds controls conditionally.
   */
  buildDependencies() {
    this.createClientForm.get('legalFormId').valueChanges.subscribe((legalFormId: number) => {
      this.legalFormChangeEvent.emit({ legalForm: legalFormId });
      if (legalFormId === 1) {
        this.createClientForm.removeControl('fullname');
        this.createClientForm.removeControl('clientNonPersonDetails');
        this.createClientForm.addControl(
          'firstname',
          new UntypedFormControl('', [
            Validators.required,
            Validators.pattern('(^[A-z]).*')])
        );
        this.createClientForm.addControl('middlename', new UntypedFormControl('', Validators.pattern('(^[A-z]).*')));
        this.createClientForm.addControl(
          'lastname',
          new UntypedFormControl('', [
            Validators.required,
            Validators.pattern('(^[A-z]).*')])
        );
      } else {
        this.createClientForm.removeControl('firstname');
        this.createClientForm.removeControl('middlename');
        this.createClientForm.removeControl('lastname');
        this.createClientForm.addControl(
          'fullname',
          new UntypedFormControl('', [
            Validators.required,
            Validators.pattern('(^[A-z]).*')])
        );
        this.createClientForm.addControl(
          'clientNonPersonDetails',
          this.formBuilder.group({
            constitutionId: [
              '',
              Validators.required
            ],
            incorpValidityTillDate: [''],
            incorpNumber: [''],
            mainBusinessLineId: [''],
            remarks: ['']
          })
        );
      }
    });
    this.createClientForm.get('legalFormId').patchValue(1);
    this.createClientForm.get('active').valueChanges.subscribe((active: boolean) => {
      if (active) {
        this.createClientForm.addControl('activationDate', new UntypedFormControl('', Validators.required));
      } else {
        this.createClientForm.removeControl('activationDate');
      }
    });
    this.createClientForm.get('addSavings').valueChanges.subscribe((active: boolean) => {
      if (active) {
        this.createClientForm.addControl('savingsProductId', new UntypedFormControl('', Validators.required));
      } else {
        this.createClientForm.removeControl('savingsProductId');
      }
    });
    this.createClientForm.get('officeId').valueChanges.subscribe((officeId: number) => {
      this.clientService.getClientWithOfficeTemplate(officeId).subscribe((clientTemplate: any) => {
        this.staffOptions = clientTemplate.staffOptions;
        this.gestorOptions = clientTemplate.staffOptions;
      });
    });
  }

  getDateLabel(legalFormId: number, values: string[]): string {
    return legalFormId === 1 ? values[0] : values[1];
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

  get personalDatatablePayload(): { registeredTableName: string; data: Record<string, unknown> } | null {
    if (!this.personalDetailsDatatable || !this.personalDatatableInputs.length) {
      return null;
    }

    const values: Record<string, unknown> = {};
    this.personalDatatableInputs.forEach((input: any) => {
      values[input.controlName] = this.createClientForm.get(input.formControlName)?.value;
    });

    const data = this.datatableService.buildPayload(
      this.personalDatatableInputs,
      values,
      this.settingsService.dateFormat,
      {
        locale: this.settingsService.language.code
      }
    );

    return {
      registeredTableName: this.personalDetailsDatatable.registeredTableName,
      data
    };
  }

  /**
   * Client General Details
   */
  get clientGeneralDetails() {
    const generalDetails = this.createClientForm.value;
    const dateFormat = this.settingsService.dateFormat;
    const locale = this.settingsService.language.code;
    for (const key in generalDetails) {
      if (generalDetails[key] === '' || key === 'addSavings' || key.startsWith('personalDt_')) {
        delete generalDetails[key];
      }
    }
    // Remove tagIds if it's an empty array
    if (Array.isArray(generalDetails.tagIds) && generalDetails.tagIds.length === 0) {
      delete generalDetails.tagIds;
    }
    if (generalDetails.submittedOnDate instanceof Date) {
      generalDetails.submittedOnDate = this.dateUtils.formatDate(generalDetails.submittedOnDate, dateFormat);
    }
    if (generalDetails.activationDate instanceof Date) {
      generalDetails.activationDate = this.dateUtils.formatDate(generalDetails.activationDate, dateFormat);
    }
    if (generalDetails.dateOfBirth instanceof Date) {
      generalDetails.dateOfBirth = this.dateUtils.formatDate(generalDetails.dateOfBirth, dateFormat);
    }

    if (generalDetails.clientNonPersonDetails && generalDetails.clientNonPersonDetails.incorpValidityTillDate) {
      generalDetails.clientNonPersonDetails = {
        ...generalDetails.clientNonPersonDetails,
        incorpValidityTillDate: this.dateUtils.formatDate(
          generalDetails.clientNonPersonDetails.incorpValidityTillDate,
          dateFormat
        ),
        dateFormat,
        locale
      };
    }
    return generalDetails;
  }
}
