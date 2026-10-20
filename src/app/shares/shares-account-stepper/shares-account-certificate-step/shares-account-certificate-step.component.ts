import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { StepperButtonsComponent } from 'app/shared/steppers/stepper-buttons/stepper-buttons.component';

@Component({
  selector: 'mifosx-shares-account-certificate-step',
  templateUrl: './shares-account-certificate-step.component.html',
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    StepperButtonsComponent
  ]
})
export class SharesAccountCertificateStepComponent implements OnChanges {
  @Input() sharesAccountTemplate: any;
  @Input() sharesAccountProductTemplate: any;
  @Input() sharesAccountTermsForm: FormGroup;
  @Input() staffOptions: any[] = [];

  certificateForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.certificateForm = this.formBuilder.group({
      series: [
        '',
        Validators.required
      ],
      bookNumber: [''],
      bookDate: [
        '',
        Validators.required
      ],
      folio: [
        '',
        [
          Validators.required,
          Validators.min(1)]
      ],
      lineNumber: [
        '',
        [
          Validators.required,
          Validators.min(1)]
      ],
      beneficiaries: this.formBuilder.array([])
    });
    this.addBeneficiary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sharesAccountProductTemplate']) {
      this.certificateForm.get('bookNumber')?.setValue(this.shareBook ? `No. ${this.shareBook}` : '');
    }
  }

  get beneficiaries(): FormArray {
    return this.certificateForm.get('beneficiaries') as FormArray;
  }

  get requestedShares(): string {
    return this.sharesAccountTermsForm?.get('requestedShares')?.value ?? '';
  }

  get unitPrice(): string {
    return this.sharesAccountTermsForm?.get('unitPrice')?.value ?? '';
  }

  get applicationDate(): Date | string {
    return this.sharesAccountTermsForm?.get('applicationDate')?.value ?? '';
  }

  get promoterName(): string {
    const staffId = this.sharesAccountTermsForm?.get('promoterStaffId')?.value;
    const staff = (this.staffOptions || []).find((option) => option.id === staffId);
    return staff?.displayName || '';
  }

  get shareBook(): string {
    const numberingCode = this.sharesAccountProductTemplate?.numberingCode;
    if (numberingCode === '1AC') {
      return '1';
    }
    if (numberingCode === '1AP') {
      return '2';
    }
    return '';
  }

  addBeneficiary(): void {
    this.beneficiaries.push(
      this.formBuilder.group({
        firstNames: [''],
        lastNames: [''],
        relationship: [''],
        percentage: [''],
        address: [''],
        phone: [''],
        dateOfBirth: ['']
      })
    );
  }

  removeBeneficiary(index: number): void {
    this.beneficiaries.removeAt(index);
  }

  get shareCertificate() {
    const value = this.certificateForm.value;
    const beneficiaries = (value.beneficiaries || []).filter(
      (row: any) => row.firstNames || row.lastNames || row.percentage
    );
    const promoterStaffId = this.sharesAccountTermsForm?.get('promoterStaffId')?.value;
    return {
      promoterStaffId: promoterStaffId || undefined,
      series: value.series,
      bookNumber: value.bookNumber,
      bookDate: value.bookDate,
      folio: value.folio,
      lineNumber: value.lineNumber,
      beneficiaries
    };
  }
}
