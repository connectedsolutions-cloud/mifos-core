import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-shares-account-certificate-step',
  templateUrl: './shares-account-certificate-step.component.html',
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatStepperPrevious,
    MatStepperNext,
    FaIconComponent
  ]
})
export class SharesAccountCertificateStepComponent implements OnInit {
  @Input() sharesAccountTemplate: any;

  certificateForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.certificateForm = this.formBuilder.group({
      promoterStaffId: [''],
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
  }

  ngOnInit(): void {
    this.addBeneficiary();
  }

  get beneficiaries(): FormArray {
    return this.certificateForm.get('beneficiaries') as FormArray;
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
        dateOfBirth: [''],
        notifyDesignation: [true]
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
    return {
      promoterStaffId: value.promoterStaffId || undefined,
      folio: value.folio,
      lineNumber: value.lineNumber,
      beneficiaries
    };
  }
}
