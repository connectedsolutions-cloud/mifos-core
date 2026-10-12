import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-saving-product-details-step',
  templateUrl: './saving-product-details-step.component.html',
  styleUrls: ['./saving-product-details-step.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTooltip,
    CdkTextareaAutosize,
    MatStepperPrevious,
    FaIconComponent,
    MatStepperNext
  ]
})
export class SavingProductDetailsStepComponent implements OnInit {
  @Input() savingProductsTemplate: any;

  savingProductDetailsForm: UntypedFormGroup;

  constructor(private formBuilder: UntypedFormBuilder) {
    this.createSavingProductDetailsForm();
  }

  ngOnInit() {
    if (this.savingProductsTemplate) {
      this.savingProductDetailsForm.patchValue({
        name: this.savingProductsTemplate.name,
        shortName: this.savingProductsTemplate.shortName,
        numberingCode: this.savingProductsTemplate.numberingCode,
        description: this.savingProductsTemplate.description
      });
      if (this.savingProductsTemplate.numberingCode) {
        this.savingProductDetailsForm.get('numberingCode')?.disable();
      }
    }
  }

  createSavingProductDetailsForm() {
    this.savingProductDetailsForm = this.formBuilder.group({
      name: [
        '',
        Validators.required
      ],
      shortName: [
        '',
        Validators.required
      ],
      numberingCode: [''],
      description: ['']
    });
  }

  get savingProductDetails() {
    const details = this.savingProductDetailsForm.getRawValue();
    if (!details.numberingCode) {
      delete details.numberingCode;
    }
    return details;
  }
}
