/** Angular Imports */
import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Dates } from 'app/core/utils/dates';

/** Custom Services */
import { SettingsService } from 'app/settings/settings.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-loan-product-details-step',
  templateUrl: './loan-product-details-step.component.html',
  styleUrls: ['./loan-product-details-step.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTooltip,
    MatCheckbox,
    CdkTextareaAutosize,
    MatStepperPrevious,
    FaIconComponent,
    MatStepperNext
  ]
})
export class LoanProductDetailsStepComponent implements OnInit {
  @Input() loanProductsTemplate: any;

  loanProductDetailsForm: UntypedFormGroup;

  fundData: any;
  tipoLineaData: any[] = [];
  sluData: any[] = [];
  filteredSluData: any[] = [];

  minDate = new Date(2000, 0, 1);
  maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 10));

  /**
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {Dates} dateUtils Date Utils.
   * @param {SettingsService} settingsService Settings Service.
   */

  constructor(
    private formBuilder: UntypedFormBuilder,
    private dateUtils: Dates,
    private settingsService: SettingsService
  ) {
    this.createLoanProductDetailsForm();
  }

  ngOnInit() {
    this.fundData = this.loanProductsTemplate.fundOptions;
    this.tipoLineaData = this.loanProductsTemplate.tipoLineaOptions || [];
    this.sluData = this.loanProductsTemplate.sluOptions || [];

    const selectedSlus = (this.loanProductsTemplate.slus || []).map((slu: any) => slu.id);
    const idTipoLinea = this.loanProductsTemplate.idTipoLinea || '';

    this.loanProductDetailsForm.patchValue({
      name: this.loanProductsTemplate.name,
      shortName: this.loanProductsTemplate.shortName,
      description: this.loanProductsTemplate.description,
      externalId: this.loanProductsTemplate.externalId,
      fundId: this.loanProductsTemplate.fundId,
      idTipoLinea,
      idSlus: selectedSlus,
      startDate: this.loanProductsTemplate.startDate && new Date(this.loanProductsTemplate.startDate),
      closeDate: this.loanProductsTemplate.closeDate && new Date(this.loanProductsTemplate.closeDate),
      includeInBorrowerCycle: this.loanProductsTemplate.includeInBorrowerCycle
    });

    this.filterSluOptions(idTipoLinea);

    this.loanProductDetailsForm.get('idTipoLinea')?.valueChanges.subscribe((tipoLineaId: string) => {
      this.filterSluOptions(tipoLineaId);
      const currentSlus: number[] = this.loanProductDetailsForm.get('idSlus')?.value || [];
      const allowedIds = new Set(this.filteredSluData.map((slu) => slu.id));
      const filteredSelection = currentSlus.filter((id) => allowedIds.has(id));
      if (filteredSelection.length !== currentSlus.length) {
        this.loanProductDetailsForm.get('idSlus')?.setValue(filteredSelection);
      }
    });
  }

  createLoanProductDetailsForm() {
    this.loanProductDetailsForm = this.formBuilder.group({
      name: [
        '',
        Validators.required
      ],
      shortName: [
        '',
        Validators.required
      ],
      description: [''],
      externalId: [''],
      fundId: [''],
      idTipoLinea: [''],
      idSlus: [[]],
      startDate: [''],
      closeDate: [''],
      includeInBorrowerCycle: [false]
    });
  }

  filterSluOptions(idTipoLinea: string) {
    if (!idTipoLinea) {
      this.filteredSluData = [...this.sluData];
      return;
    }
    this.filteredSluData = this.sluData.filter((slu) => slu.idTipoLinea === idTipoLinea);
  }

  formatSluLabel(slu: any): string {
    const band = `${this.formatCurrencyAmount(slu.montoIni)} - ${this.formatCurrencyAmount(slu.montoFin)}`;
    return `${slu.slu} · ${slu.descripcion} (${band})`;
  }

  formatCurrencyAmount(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  }

  get loanProductDetails() {
    const loanProductDetailsFormData = this.loanProductDetailsForm.value;
    const prevStartDate: Date = this.loanProductDetailsForm.value.startDate;
    const prevCloseDate: Date = this.loanProductDetailsForm.value.closeDate;
    const dateFormat = this.settingsService.dateFormat;
    if (loanProductDetailsFormData.startDate instanceof Date) {
      loanProductDetailsFormData.startDate = this.dateUtils.formatDate(prevStartDate, dateFormat) || '';
    }
    if (loanProductDetailsFormData.closeDate instanceof Date) {
      loanProductDetailsFormData.closeDate = this.dateUtils.formatDate(prevCloseDate, dateFormat) || '';
    }
    if (!loanProductDetailsFormData.idTipoLinea) {
      loanProductDetailsFormData.idTipoLinea = null;
    }
    if (!loanProductDetailsFormData.idSlus) {
      loanProductDetailsFormData.idSlus = [];
    }
    return loanProductDetailsFormData;
  }
}
