import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-recurring-deposit-product-details-step',
  templateUrl: './recurring-deposit-product-details-step.component.html',
  styleUrls: ['./recurring-deposit-product-details-step.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTooltip,
    CdkTextareaAutosize,
    MatStepperPrevious,
    FaIconComponent,
    MatStepperNext
  ]
})
export class RecurringDepositProductDetailsStepComponent implements OnInit {
  @Input() recurringDepositProductsTemplate: any;

  recurringDepositProductDetailsForm: UntypedFormGroup;

  constructor(private formBuilder: UntypedFormBuilder) {
    this.createrecurringDepositProductDetailsForm();
  }

  ngOnInit() {
    if (!(this.recurringDepositProductsTemplate === undefined) && this.recurringDepositProductsTemplate.id) {
      this.recurringDepositProductDetailsForm.patchValue({
        name: this.recurringDepositProductsTemplate.name,
        shortName: this.recurringDepositProductsTemplate.shortName,
        numberingCode: this.recurringDepositProductsTemplate.numberingCode,
        description: this.recurringDepositProductsTemplate.description
      });
      if (this.recurringDepositProductsTemplate.numberingCode) {
        this.recurringDepositProductDetailsForm.get('numberingCode')?.disable();
      }
    }
  }

  createrecurringDepositProductDetailsForm() {
    this.recurringDepositProductDetailsForm = this.formBuilder.group({
      name: [
        '',
        Validators.required
      ],
      shortName: [
        '',
        Validators.required
      ],
      numberingCode: [''],
      description: [
        '',
        Validators.required
      ]
    });
  }

  get recurringDepositProductDetails() {
    const details = this.recurringDepositProductDetailsForm.getRawValue();
    if (!details.numberingCode) {
      delete details.numberingCode;
    }
    return details;
  }
}
