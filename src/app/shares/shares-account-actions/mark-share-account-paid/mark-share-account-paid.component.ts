/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationService } from 'app/organization/organization.service';
import { SharesService } from 'app/shares/shares.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-mark-share-account-paid',
  templateUrl: './mark-share-account-paid.component.html',
  imports: [...STANDALONE_SHARED_IMPORTS]
})
export class MarkShareAccountPaidComponent implements OnInit {
  minDate = new Date(2000, 0, 1);
  maxDate = new Date();
  markPaidForm: UntypedFormGroup;
  accountId: any;
  paymentTypes: any[] = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private sharesService: SharesService,
    private organizationService: OrganizationService,
    private dateUtils: Dates,
    private route: ActivatedRoute,
    private router: Router,
    private settingsService: SettingsService
  ) {
    this.accountId = this.route.parent.snapshot.params['shareAccountId'];
  }

  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.markPaidForm = this.formBuilder.group({
      transactionDate: [
        '',
        Validators.required
      ],
      paymentTypeId: [
        '',
        Validators.required
      ],
      checkNumber: [''],
      bankNumber: [''],
      accountNumber: [''],
      receiptNumber: ['']
    });
    this.organizationService.getPaymentTypes().subscribe((paymentTypes: any[]) => {
      this.paymentTypes = (paymentTypes || []).filter((paymentType) => !paymentType.isCashPayment);
    });
  }

  get detailsMissing(): boolean {
    const value = this.markPaidForm?.value;
    if (!value) {
      return true;
    }
    return ![
      value.checkNumber,
      value.bankNumber,
      value.accountNumber,
      value.receiptNumber
    ].some((detail) => String(detail || '').trim().length > 0);
  }

  submit() {
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const formValue = this.markPaidForm.value;
    const transactionDate =
      formValue.transactionDate instanceof Date
        ? this.dateUtils.formatDate(formValue.transactionDate, dateFormat)
        : formValue.transactionDate;
    const data = {
      ...formValue,
      transactionDate,
      dateFormat,
      locale
    };
    this.sharesService.executeSharesAccountCommand(this.accountId, 'markaspaid', data).subscribe(() => {
      this.router.navigate(['../../'], { relativeTo: this.route });
    });
  }
}
