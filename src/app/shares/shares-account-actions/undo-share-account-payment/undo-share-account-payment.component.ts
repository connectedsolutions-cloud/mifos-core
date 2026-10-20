/** Angular Imports */
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharesService } from 'app/shares/shares.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-undo-share-account-payment',
  templateUrl: './undo-share-account-payment.component.html',
  imports: [...STANDALONE_SHARED_IMPORTS]
})
export class UndoShareAccountPaymentComponent {
  accountId: any;

  constructor(
    private sharesService: SharesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.accountId = this.route.parent.snapshot.params['shareAccountId'];
  }

  submit() {
    this.sharesService.executeSharesAccountCommand(this.accountId, 'undopayment', {}).subscribe(() => {
      this.router.navigate(['../../'], { relativeTo: this.route });
    });
  }
}
