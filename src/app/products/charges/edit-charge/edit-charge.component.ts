/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

/** Custom Services */
import { ProductsService } from 'app/products/products.service';
import { SettingsService } from 'app/settings/settings.service';
import { maxNumberValueValidator } from 'app/shared/validators/max-number-value.validator';
import { minNumberValueValidator } from 'app/shared/validators/min-number-value.validator';
import { ValidateOnFocusDirective } from '../../../directives/validate-on-focus.directive';
import { GlAccountSelectorComponent } from '../../../shared/accounting/gl-account-selector/gl-account-selector.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Edit Charge component.
 */
@Component({
  selector: 'mifosx-edit-charge',
  templateUrl: './edit-charge.component.html',
  styleUrls: ['./edit-charge.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    ValidateOnFocusDirective,
    GlAccountSelectorComponent,
    MatCheckbox
  ]
})
export class EditChargeComponent implements OnInit {
  /** Selected Data. */
  chargeData: any;
  /** Charge form. */
  chargeForm: UntypedFormGroup;
  /** Select Income. */
  selectedIncome: any;
  /** Select Time Type. */
  selectedTime: any;
  /** Select Currency Type. */
  selectedCurrency: any;
  /** Select Calculation Type. */
  selectedCalculation: any;
  /** Charge Time Type options. */
  chargeTimeTypeOptions: any;
  /** Charge Calculation Type options. */
  chargeCalculationTypeOptions: any;
  /** Charge Calculation Type data (unfiltered). */
  chargeCalculationTypeData: any;
  /** Show Penalty. */
  showPenalty = true;
  /** Add Fee Frequency. */
  addFeeFrequency = true;
  /** Show GL Accounts. */
  showGLAccount = false;
  /** Charge Payment Mode. */
  chargePaymentMode = false;
  /** Show Fee Options. */
  showFeeOptions = false;

  /**
   * GL account list for debit/credit dropdowns (chart of accounts).
   */
  get glAccountListForDebitCredit(): any[] {
    const options = this.chargeData?.incomeOrLiabilityAccountOptions?.incomeAccountOptions;
    if (options && options.length) {
      return options;
    }
    return this.chargeData?.assetAccountOptions || [];
  }

  /**
   * Retrieves the charge data from `resolve`.
   * @param {ProductsService} productsService Products Service.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   * @param {SettingsService} settingsService Settings Service
   */
  constructor(
    private productsService: ProductsService,
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private settingsService: SettingsService
  ) {
    this.route.data.subscribe((data: { chargesTemplate: any }) => {
      this.chargeData = data.chargesTemplate;
    });
  }

  ngOnInit() {
    this.editChargeForm();
  }

  /**
   * Edit Charge form.
   */
  editChargeForm() {
    this.showFeeOptions = this.chargeData.feeInterval && this.chargeData.feeInterval > 0;

    this.chargeForm = this.formBuilder.group({
      name: [
        this.chargeData.name,
        Validators.required
      ],
      chargeAppliesTo: [
        { value: this.chargeData.chargeAppliesTo.id, disabled: true },
        Validators.required
      ],
      currencyCode: [
        this.chargeData.currency.code,
        Validators.required
      ],
      amount: [
        this.chargeData.amount,
        Validators.required
      ],
      active: [this.chargeData.active],
      penalty: [this.chargeData.penalty],
      minCap: [
        this.chargeData.minCap || null,
        [maxNumberValueValidator('maxCap')]
      ],
      maxCap: [
        this.chargeData.maxCap || null,
        [minNumberValueValidator('minCap')]
      ],
      chargeTimeType: [
        this.chargeData.chargeTimeType.id,
        Validators.required
      ],
      chargeCalculationType: [
        this.chargeData.chargeCalculationType.id,
        Validators.required
      ]
    });
    switch (this.chargeData.chargeAppliesTo.value) {
      case 'Loan': {
        this.chargeTimeTypeOptions = this.chargeData.loanChargeTimeTypeOptions;
        this.chargeCalculationTypeData = this.chargeData.loanChargeCalculationTypeOptions;
        this.chargeCalculationTypeOptions = this.chargeData.loanChargeCalculationTypeOptions;
        this.addFeeFrequency = true;
        this.chargePaymentMode = true;
        this.chargeForm.addControl(
          'chargePaymentMode',
          this.formBuilder.control(this.chargeData.chargePaymentMode.id, Validators.required)
        );
        this.chargeForm.addControl(
          'delinquencyRangeId',
          this.formBuilder.control(this.chargeData.delinquencyRangeId ?? null)
        );
        if (this.chargeData.chargeTimeType.id === 18) {
          this.chargeForm.get('delinquencyRangeId')?.setValidators(Validators.required);
        }
        if (this.showFeeOptions) {
          this.getFeeFrequency(this.showFeeOptions);
          this.chargeForm.patchValue({
            feeInterval: this.chargeData.feeInterval,
            feeFrequency: this.chargeData.feeFrequency.id
          });
        }
        break;
      }
      case 'Savings': {
        this.chargeTimeTypeOptions = this.chargeData.savingsChargeTimeTypeOptions;
        this.chargeCalculationTypeData = this.chargeData.savingsChargeCalculationTypeOptions;
        this.chargeCalculationTypeOptions = this.chargeData.savingsChargeCalculationTypeOptions;
        this.addFeeFrequency = false;
        break;
      }
      case 'Shares': {
        this.chargeTimeTypeOptions = this.chargeData.shareChargeTimeTypeOptions;
        this.chargeCalculationTypeData = this.chargeData.shareChargeCalculationTypeOptions;
        this.chargeCalculationTypeOptions = this.chargeData.shareChargeCalculationTypeOptions;
        this.addFeeFrequency = false;
        this.showGLAccount = false;
        this.showPenalty = false;
        break;
      }
      default: {
        this.chargeCalculationTypeData = this.chargeData.clientChargeCalculationTypeOptions;
        this.chargeCalculationTypeOptions = this.chargeData.clientChargeCalculationTypeOptions;
        this.chargeTimeTypeOptions = this.chargeData.clientChargeTimeTypeOptions;
        this.showGLAccount = true;
        this.addFeeFrequency = false;
        this.chargeForm.addControl(
          'incomeAccountId',
          this.formBuilder.control(this.chargeData.incomeOrLiabilityAccount?.id, Validators.required)
        );
        break;
      }
    }
    if (this.chargeData.taxGroup) {
      this.chargeForm.addControl(
        'taxGroupId',
        this.formBuilder.control({ value: this.chargeData.taxGroup.id, disabled: true })
      );
    } else {
      this.chargeForm.addControl('taxGroupId', this.formBuilder.control({ value: '' }));
    }

    // Debit and credit account (optional, available for all charge types)
    this.chargeForm.addControl('debitAccountId', this.formBuilder.control(this.chargeData.debitAccount?.id ?? null));
    this.chargeForm.addControl('creditAccountId', this.formBuilder.control(this.chargeData.creditAccount?.id ?? null));

    // Listen to chargeTimeType changes and validate/reset chargeCalculationType if needed
    this.chargeForm.get('chargeTimeType')?.valueChanges.subscribe((chargeTimeType) => {
      const currentChargeCalculationType = this.chargeForm.get('chargeCalculationType')?.value;

      // If chargeTimeType is not 12 (TRANCHE_DISBURSEMENT) and chargeCalculationType is 5, reset it
      if (chargeTimeType !== 12 && currentChargeCalculationType === 5) {
        this.chargeForm.get('chargeCalculationType')?.setValue('');
      }

      // If chargeTimeType is 12 and chargeCalculationType is 3 or 4, reset it
      if (chargeTimeType === 12 && (currentChargeCalculationType === 3 || currentChargeCalculationType === 4)) {
        this.chargeForm.get('chargeCalculationType')?.setValue('');
      }

      if (chargeTimeType === 18 && this.chargeForm.get('chargeAppliesTo')?.value === 1) {
        this.chargeForm.get('delinquencyRangeId')?.setValidators(Validators.required);
        this.chargeForm.get('chargeCalculationType')?.setValue(7);
      } else {
        this.chargeForm.get('delinquencyRangeId')?.clearValidators();
        if (chargeTimeType !== 18 && currentChargeCalculationType === 7) {
          this.chargeForm.get('chargeCalculationType')?.setValue('');
        }
      }
      this.chargeForm.get('delinquencyRangeId')?.updateValueAndValidity();
    });
  }

  /**
   * Get Add Fee Frequency value.
   */
  getFeeFrequency(isChecked: boolean) {
    this.showFeeOptions = isChecked;
    if (isChecked) {
      this.chargeForm.addControl('feeInterval', this.formBuilder.control('', Validators.required));
      this.chargeForm.addControl('feeFrequency', this.formBuilder.control('', Validators.required));
    } else {
      this.chargeForm.removeControl('feeInterval');
      this.chargeForm.removeControl('feeFrequency');
    }
  }

  /**
   * @returns {any} Filtered charge calculation type data.
   */
  filteredChargeCalculationType(): any {
    if (!this.chargeCalculationTypeData) {
      return [];
    }
    const currentChargeCalculationType = this.chargeForm.get('chargeCalculationType')?.value;
    return this.chargeCalculationTypeData.filter((chargeCalculationType: any) => {
      const chargeTimeType = this.chargeForm.get('chargeTimeType')?.value;
      const chargeAppliesTo = this.chargeForm.get('chargeAppliesTo')?.value;

      // Always include the currently selected value so it's visible even if it would be filtered out
      if (chargeCalculationType.id === currentChargeCalculationType) {
        return true;
      }

      if (chargeTimeType === 18 && chargeCalculationType.id !== 7) {
        return false;
      }
      if (chargeTimeType !== 18 && chargeCalculationType.id === 7) {
        return false;
      }

      // Filter out option 5 (% disbursed amount) unless chargeTimeType is 12 (TRANCHE_DISBURSEMENT)
      if (chargeTimeType !== 12 && chargeCalculationType.id === 5) {
        return false;
      }

      // Filter out options 3 and 4 when chargeTimeType is 12 (TRANCHE_DISBURSEMENT)
      if (chargeTimeType === 12 && (chargeCalculationType.id === 3 || chargeCalculationType.id === 4)) {
        return false;
      }

      // For Savings (chargeAppliesTo === 2), filter out option 2 (% amount) unless chargeTimeType is 5, 16, or 17
      if (chargeAppliesTo === 2) {
        if (
          !(chargeTimeType === 5 || chargeTimeType === 16 || chargeTimeType === 17) &&
          chargeCalculationType.id === 2
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Submits Edit Charge form.
   */
  submit() {
    const charges = this.chargeForm.getRawValue();
    charges.locale = this.settingsService.language.code;
    if (charges.taxGroupId.value === '') {
      delete charges.taxGroupId;
    }
    if (!charges.minCap) {
      delete charges.minCap;
    }
    if (!charges.maxCap) {
      delete charges.maxCap;
    }
    // Ensure debit/credit account IDs are sent as numbers when present (backend persists them on m_charge)
    const debitId = charges.debitAccountId;
    const creditId = charges.creditAccountId;
    if (debitId != null && debitId !== '') {
      charges.debitAccountId = typeof debitId === 'number' ? debitId : Number(debitId);
    } else {
      delete charges.debitAccountId;
    }
    if (creditId != null && creditId !== '') {
      charges.creditAccountId = typeof creditId === 'number' ? creditId : Number(creditId);
    } else {
      delete charges.creditAccountId;
    }
    const dr = charges.delinquencyRangeId;
    if (dr == null || dr === '') {
      delete charges.delinquencyRangeId;
    } else {
      charges.delinquencyRangeId = typeof dr === 'number' ? dr : Number(dr);
    }
    this.productsService.updateCharge(this.chargeData.id.toString(), charges).subscribe((response: any) => {
      this.router.navigate(['../'], { relativeTo: this.route });
    });
  }
}
