/** Angular Imports */
import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

/** Custom Services */
import { LoansService } from 'app/loans/loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { Currency } from 'app/shared/models/general.model';
import { InputAmountComponent } from '../../../../shared/input-amount/input-amount.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { FormatNumberPipe } from '../../../../pipes/format-number.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Loan Make Repayment Component
 */
@Component({
  selector: 'mifosx-make-repayment',
  templateUrl: './make-repayment.component.html',
  styleUrls: ['./make-repayment.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    InputAmountComponent,
    MatSlideToggle,
    CdkTextareaAutosize,
    FormatNumberPipe
  ]
})
export class MakeRepaymentComponent implements OnInit {
  @Input() dataObject: any;
  /** Loan Id */
  loanId: string;
  /** Payment Type Options */
  paymentTypes: any;
  /** Show payment details */
  showPaymentDetails = false;
  /** Minimum Date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum Date allowed. */
  maxDate = new Date();
  /** Repayment Loan Form */
  repaymentLoanForm: UntypedFormGroup;
  currency: Currency | null = null;

  command: string | null = null;

  classificationOptions: any[] = [];

  /**
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {LoansService} loanService Loan Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   * @param {SettingsService} settingsService Settings Service
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private loanService: LoansService,
    private route: ActivatedRoute,
    private router: Router,
    private dateUtils: Dates,
    private settingsService: SettingsService
  ) {
    this.loanId = this.route.snapshot.params['loanId'];
  }

  /**
   * Creates the repayment loan form
   * and initialize with the required values
   */
  ngOnInit() {
    this.command = this.dataObject.type.code.split('.')[1];
    this.maxDate = this.settingsService.businessDate;

    // Check if loan is in simulation mode and adjust maxDate accordingly
    // For simulated loans, allow future dates up to the simulated date or a reasonable future date
    // Try to access loan details from route data first (async)

    // Check parent route data using subscription for async access
    if (this.route.parent) {
      this.route.parent.data.subscribe((data: any) => {
        if (data['loanDetailsData']) {
          this.updateMaxDateForSimulatedLoan(data['loanDetailsData']);
        }
      });
    }

    // Also check current route data
    this.route.data.subscribe((data: any) => {
      if (data['loanDetailsData']) {
        this.updateMaxDateForSimulatedLoan(data['loanDetailsData']);
      }
    });

    // Always fetch loan details to ensure we have the latest simulation status
    // This is a fallback and ensures we have the data even if route data isn't available
    if (this.loanId) {
      this.loanService.getLoanAccountAssociationDetails(this.loanId).subscribe((loanData: any) => {
        this.updateMaxDateForSimulatedLoan(loanData);
      });
    }

    this.createRepaymentLoanForm();
    this.setRepaymentLoanDetails();
    if (this.dataObject.currency) {
      this.currency = this.dataObject.currency;
    }
  }

  /**
   * Updates maxDate to allow future dates if loan is simulated
   */
  private updateMaxDateForSimulatedLoan(loanData: any): void {
    // Check if loan is simulated (support both isSimulation and simulated properties)
    const isSimulated = loanData?.isSimulation === true || loanData?.simulated === true;

    if (isSimulated) {
      // If loan is simulated, allow future dates
      // Use simulatedDate if available, otherwise allow dates far into the future
      if (loanData.simulatedDate) {
        const simulatedDate = new Date(loanData.simulatedDate);
        if (!isNaN(simulatedDate.getTime())) {
          this.maxDate = simulatedDate;
        } else {
          // If simulatedDate is invalid, allow dates far into the future
          this.maxDate = new Date(2100, 0, 1);
        }
      } else {
        // If simulated but no simulatedDate, allow dates far into the future
        this.maxDate = new Date(2100, 0, 1);
      }
    }
  }

  /**
   * Creates the create close form.
   */
  createRepaymentLoanForm() {
    this.repaymentLoanForm = this.formBuilder.group({
      transactionDate: [
        this.settingsService.businessDate,
        Validators.required
      ],
      externalId: '',
      paymentTypeId: '',
      note: '',
      skipInterestRefund: [false]
    });

    if (this.isCapitalizedIncome()) {
      this.repaymentLoanForm.addControl(
        'transactionAmount',
        new UntypedFormControl('', [
          Validators.required,
          Validators.min(0.001),
          Validators.max(this.dataObject.amount)])
      );
    } else {
      this.repaymentLoanForm.addControl(
        'transactionAmount',
        new UntypedFormControl('', [
          Validators.required,
          Validators.min(0.001)])
      );
    }
    if (this.isCapitalizedIncome() || this.isBuyDownFee()) {
      this.repaymentLoanForm.addControl('classificationId', new UntypedFormControl(''));
    }
  }

  setRepaymentLoanDetails() {
    this.paymentTypes = this.dataObject.paymentTypeOptions;
    this.classificationOptions = this.dataObject.classificationOptions;
    this.repaymentLoanForm.patchValue({
      transactionAmount: this.dataObject.amount
    });
  }

  /**
   * Add payment detail fields to the UI.
   */
  addPaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
    if (this.showPaymentDetails) {
      this.repaymentLoanForm.addControl('accountNumber', new UntypedFormControl(''));
      this.repaymentLoanForm.addControl('checkNumber', new UntypedFormControl(''));
      this.repaymentLoanForm.addControl('routingCode', new UntypedFormControl(''));
      this.repaymentLoanForm.addControl('receiptNumber', new UntypedFormControl(''));
      this.repaymentLoanForm.addControl('bankNumber', new UntypedFormControl(''));
    } else {
      this.repaymentLoanForm.removeControl('accountNumber');
      this.repaymentLoanForm.removeControl('checkNumber');
      this.repaymentLoanForm.removeControl('routingCode');
      this.repaymentLoanForm.removeControl('receiptNumber');
      this.repaymentLoanForm.removeControl('bankNumber');
    }
  }

  showDetails(): boolean {
    return !this.isCapitalizedIncome() && !this.isBuyDownFee();
  }

  isCapitalizedIncome(): boolean {
    return [
      'capitalizedIncome',
      'capitalizedIncomeAdjustment'
    ].includes(this.command);
  }

  isBuyDownFee(): boolean {
    return [
      'buyDownFee'
    ].includes(this.command);
  }

  showInterestRefundCheckbox(): boolean {
    const code = this.dataObject?.type?.code?.toLowerCase() || '';
    return code.includes('merchantissuedrefund') || code.includes('payoutrefund');
  }

  /** Submits the repayment form */
  submit() {
    const repaymentLoanFormData = this.repaymentLoanForm.value;
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const prevTransactionDate: Date = this.repaymentLoanForm.value.transactionDate;
    if (repaymentLoanFormData.transactionDate instanceof Date) {
      repaymentLoanFormData.transactionDate = this.dateUtils.formatDate(prevTransactionDate, dateFormat);
    }
    const data: any = {
      ...repaymentLoanFormData,
      dateFormat,
      locale
    };
    data['transactionAmount'] = data['transactionAmount'] * 1;
    if (repaymentLoanFormData.skipInterestRefund) {
      data.interestRefundCalculation = false;
    }
    delete data.skipInterestRefund;
    this.loanService.submitLoanActionButton(this.loanId, data, this.command).subscribe((response: any) => {
      this.router.navigate(['../../transactions'], { relativeTo: this.route });
    });
  }
}
