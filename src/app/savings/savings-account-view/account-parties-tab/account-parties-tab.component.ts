import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SavingsService } from 'app/savings/savings.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-account-parties-tab',
  templateUrl: './account-parties-tab.component.html',
  styleUrls: ['./account-parties-tab.component.scss'],
  imports: [...STANDALONE_SHARED_IMPORTS]
})
export class AccountPartiesTabComponent implements OnInit {
  accountId: string;
  form: FormGroup;
  loading = true;
  saving = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private savingsService: SavingsService
  ) {
    this.accountId = this.route.parent.snapshot.params['savingAccountId'];
    this.form = this.formBuilder.group({
      beneficiaries: this.formBuilder.array([]),
      authorizedPersons: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.load();
  }

  get beneficiaries(): FormArray {
    return this.form.get('beneficiaries') as FormArray;
  }

  get authorizedPersons(): FormArray {
    return this.form.get('authorizedPersons') as FormArray;
  }

  get beneficiaryTotal(): number {
    return this.beneficiaries.controls.reduce(
      (total: number, control: any) => total + Number(control.get('allocationPercentage').value || 0),
      0
    );
  }

  load(): void {
    this.loading = true;
    forkJoin({
      beneficiaries: this.savingsService.getSavingsBeneficiaries(this.accountId),
      authorizedPersons: this.savingsService.getSavingsAuthorizedPersons(this.accountId)
    }).subscribe({
      next: ({ beneficiaries, authorizedPersons }) => {
        this.form.setControl(
          'beneficiaries',
          this.formBuilder.array(beneficiaries.map((item: any) => this.beneficiaryGroup(item)))
        );
        this.form.setControl(
          'authorizedPersons',
          this.formBuilder.array(authorizedPersons.map((item: any) => this.authorizedPersonGroup(item)))
        );
        this.loading = false;
      },
      error: () => {
        this.message = 'Unable to load beneficiaries and authorized persons.';
        this.loading = false;
      }
    });
  }

  addBeneficiary(): void {
    this.beneficiaries.push(this.beneficiaryGroup({}));
  }

  removeBeneficiary(index: number): void {
    this.beneficiaries.removeAt(index);
  }

  addAuthorizedPerson(): void {
    this.authorizedPersons.push(this.authorizedPersonGroup({}));
  }

  removeAuthorizedPerson(index: number): void {
    this.authorizedPersons.removeAt(index);
  }

  save(): void {
    if (this.form.invalid || (this.beneficiaries.length > 0 && Math.abs(this.beneficiaryTotal - 100) > 0.001)) {
      this.form.markAllAsTouched();
      this.message = 'Beneficiary allocations must total exactly 100.00.';
      return;
    }
    this.saving = true;
    this.message = '';
    forkJoin({
      beneficiaries: this.savingsService.replaceSavingsBeneficiaries(this.accountId, this.beneficiaries.getRawValue()),
      authorizedPersons: this.savingsService.replaceSavingsAuthorizedPersons(
        this.accountId,
        this.authorizedPersons.getRawValue()
      )
    }).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Account parties saved.';
        this.load();
      },
      error: () => {
        this.saving = false;
        this.message = 'Unable to save account parties.';
      }
    });
  }

  private beneficiaryGroup(value: any): FormGroup {
    return this.formBuilder.group({
      id: [value.id || null],
      linkedClientId: [value.linkedClientId || null],
      externalId: [value.externalId || null],
      givenName: [
        value.givenName || '',
        Validators.required
      ],
      surname: [value.surname || ''],
      allocationPercentage: [
        value.allocationPercentage || null,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.max(100)]
      ],
      dateOfBirth: [this.inputDate(value.dateOfBirth)],
      sourceAge: [value.sourceAge || null],
      dui: [value.dui || ''],
      relationship: [value.relationship || ''],
      address: [value.address || ''],
      phone: [value.phone || ''],
      communicateDesignation: [value.communicateDesignation || false]
    });
  }

  private authorizedPersonGroup(value: any): FormGroup {
    return this.formBuilder.group({
      id: [value.id || null],
      linkedClientId: [value.linkedClientId || null],
      externalId: [value.externalId || null],
      givenName: [
        value.givenName || '',
        Validators.required
      ],
      surname: [value.surname || ''],
      dateOfBirth: [this.inputDate(value.dateOfBirth)],
      dui: [value.dui || ''],
      relationship: [value.relationship || ''],
      address: [value.address || ''],
      phone: [value.phone || ''],
      printOnContract: [value.printOnContract || false],
      printOnPassbook: [value.printOnPassbook || false],
      signatureReference: [value.signatureReference || null]
    });
  }

  private inputDate(value: string | number[] | null | undefined): string | null {
    if (Array.isArray(value) && value.length === 3) {
      return `${value[0]}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
    }
    return typeof value === 'string' ? value : null;
  }
}
