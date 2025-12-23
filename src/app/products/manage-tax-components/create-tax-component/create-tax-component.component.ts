/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  UntypedFormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

/** Custom Services */
import { ProductsService } from '../../products.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { GlAccountSelectorComponent } from '../../../shared/accounting/gl-account-selector/gl-account-selector.component';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Create Tax Component component.
 */
@Component({
  selector: 'mifosx-create-tax-component',
  templateUrl: './create-tax-component.component.html',
  styleUrls: ['./create-tax-component.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    GlAccountSelectorComponent
  ]
})
export class CreateTaxComponentComponent implements OnInit {
  /** Minimum start date allowed. */
  minDate = new Date();
  /** Maximum start date allowed. */
  maxDate = new Date();
  /** Tax Component form. */
  taxComponentForm: UntypedFormGroup;
  /** Tax Component template data. */
  taxComponentTemplateData: any;
  /** Credit Account Type data. */
  creditAccountTypeData: any;
  /** Credit Account data. */
  creditAccountData: any[] = [];
  /** Debit Account Type data. */
  debitAccountTypeData: any;
  /** Debit Account data. */
  debitAccountData: any[] = [];

  /**
   * Retrieves the tax Component template data from `resolve`.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {ProductsService} productsService Products Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   * @param {Dates} dateUtils Date Utils to format date.
   * @param {SettingsService} settingsService Settings Service.
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private productsService: ProductsService,
    private route: ActivatedRoute,
    private router: Router,
    private dateUtils: Dates,
    private settingsService: SettingsService
  ) {
    this.route.data.subscribe((data: { taxComponentTemplate: any }) => {
      this.taxComponentTemplateData = data.taxComponentTemplate;
    });
  }

  /**
   * Creates the tax Component form
   */
  ngOnInit() {
    this.minDate = this.settingsService.minAllowedDate;
    this.maxDate = this.settingsService.maxAllowedDate;
    this.createTaxComponentForm();
    this.setConditionalControls();
  }

  /**
   * Creates the tax Component form
   */
  createTaxComponentForm() {
    this.creditAccountTypeData = this.debitAccountTypeData = this.taxComponentTemplateData.glAccountTypeOptions;
    this.taxComponentForm = this.formBuilder.group({
      name: [
        '',
        Validators.required
      ],
      percentage: [
        '',
        [
          Validators.required,
          Validators.pattern('^(0*[1-9][0-9]*(\\.[0-9]+)?|0+\\.[0-9]*[1-9][0-9]*)$'),
          Validators.max(100)]
      ],
      creditAccountType: [''],
      debitAccountType: [''],
      startDate: [
        '',
        Validators.required
      ]
    });
  }

  /**
   * Sets the conditional controls of the tax Component form
   */
  setConditionalControls() {
    this.taxComponentForm.get('debitAccountType').valueChanges.subscribe((debitAccountTypeId) => {
      if (debitAccountTypeId && debitAccountTypeId !== '') {
        this.debitAccountData = this.getAccountsData(debitAccountTypeId);
        if (!this.taxComponentForm.get('debitAccountId')) {
          this.taxComponentForm.addControl('debitAccountId', new UntypedFormControl('', Validators.required));
        }
      } else {
        this.debitAccountData = [];
        if (this.taxComponentForm.get('debitAccountId')) {
          this.taxComponentForm.removeControl('debitAccountId');
        }
      }
    });
    this.taxComponentForm.get('creditAccountType').valueChanges.subscribe((creditAccountTypeId) => {
      if (creditAccountTypeId && creditAccountTypeId !== '') {
        this.creditAccountData = this.getAccountsData(creditAccountTypeId);
        if (!this.taxComponentForm.get('creditAccountId')) {
          this.taxComponentForm.addControl('creditAccountId', new UntypedFormControl('', Validators.required));
        }
      } else {
        this.creditAccountData = [];
        if (this.taxComponentForm.get('creditAccountId')) {
          this.taxComponentForm.removeControl('creditAccountId');
        }
      }
    });
  }

  /**
   * @param {number} accountTypeId Account type ID of account type.
   * @returns {any} Accounts data
   */
  getAccountsData(accountTypeId: number) {
    switch (accountTypeId) {
      case 1:
        return this.taxComponentTemplateData.glAccountOptions.assetAccountOptions || [];
      case 2:
        return this.taxComponentTemplateData.glAccountOptions.liabilityAccountOptions || [];
      case 3:
        return this.taxComponentTemplateData.glAccountOptions.equityAccountOptions || [];
      case 4:
        return this.taxComponentTemplateData.glAccountOptions.incomeAccountOptions || [];
      case 5:
        return this.taxComponentTemplateData.glAccountOptions.expenseAccountOptions || [];
    }
  }

  /**
   * Submits the tax Component form and creates the tax Component,
   * if successful redirects to Tax Components.
   */
  submit() {
    const taxComponentFormData = this.taxComponentForm.value;
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const prevStartDate: Date = this.taxComponentForm.value.startDate;
    if (taxComponentFormData.startDate instanceof Date) {
      taxComponentFormData.startDate = this.dateUtils.formatDate(prevStartDate, dateFormat);
    }

    // Map form field names to backend-expected parameter names (backend has typos in parameter names)
    // Backend validation: if debitAccountType OR debitAccountId is provided, BOTH must be provided
    const data: any = {
      name: taxComponentFormData.name,
      percentage: taxComponentFormData.percentage,
      startDate: taxComponentFormData.startDate,
      dateFormat,
      locale
    };

    // Only include debit account fields if BOTH type and ID are provided
    // Backend validation: if debitAccountType OR debitAccountId is provided, BOTH must be provided
    const debitAccountTypeControl = this.taxComponentForm.get('debitAccountType');
    const debitAccountIdControl = this.taxComponentForm.get('debitAccountId');
    const debitAccountType = debitAccountTypeControl ? debitAccountTypeControl.value : null;
    const debitAccountId = debitAccountIdControl ? debitAccountIdControl.value : null;

    // Check if both values are valid
    // Note: Account IDs are numbers, so we check for truthy values (not null, undefined, 0, or empty string)
    const hasValidDebitAccountType = debitAccountType != null && debitAccountType !== '' && debitAccountType !== 0;
    const hasValidDebitAccountId = debitAccountId != null && debitAccountId !== '' && debitAccountId !== 0;

    if (hasValidDebitAccountType && hasValidDebitAccountId) {
      data.debitAccountType = debitAccountType;
      data.debitAccountId = debitAccountId;
    }

    // Only include credit account fields if BOTH type and ID are provided
    // Backend validation: if creditAccountType OR creditAccountId is provided, BOTH must be provided
    const creditAccountTypeControl = this.taxComponentForm.get('creditAccountType');
    const creditAccountIdControl = this.taxComponentForm.get('creditAccountId');
    const creditAccountType = creditAccountTypeControl ? creditAccountTypeControl.value : null;
    const creditAccountId = creditAccountIdControl ? creditAccountIdControl.value : null;

    // Check if both values are valid
    const hasValidCreditAccountType = creditAccountType != null && creditAccountType !== '' && creditAccountType !== 0;
    const hasValidCreditAccountId = creditAccountId != null && creditAccountId !== '' && creditAccountId !== 0;

    if (hasValidCreditAccountType && hasValidCreditAccountId) {
      data.creditAccountType = creditAccountType;
      data.creditAccountId = creditAccountId;
    }

    this.productsService.createTaxComponent(data).subscribe((response: any) => {
      this.router.navigate(
        [
          '../',
          response.resourceId
        ],
        { relativeTo: this.route }
      );
    });
  }
}
