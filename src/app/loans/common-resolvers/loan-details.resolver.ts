/** Angular Imports */
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';

/** rxjs Imports */
import { Observable } from 'rxjs';

/** Custom Services */
import { LoansService } from '../loans.service';
import { LoanViewRefreshService } from '../loan-view-refresh.service';

/**
 * Clients data resolver.
 */
@Injectable()
export class LoanDetailsResolver {
  /**
   * @param {LoansService} LoansService Loans service.
   * @param {LoanViewRefreshService} loanViewRefreshService Signals cache-bust after mutate.
   */
  constructor(
    private loansService: LoansService,
    private loanViewRefreshService: LoanViewRefreshService
  ) {}

  /**
   * Returns the Loans with Association data.
   * @returns {Observable<any>}
   */
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const loanId = route.paramMap.get('loanId') || route.parent.paramMap.get('loanId');
    if (!isNaN(+loanId)) {
      // Peek (do not consume): parent + child routes may both resolve on one navigation.
      const skipCache = this.loanViewRefreshService.isShouldRefresh();
      return this.loansService.getLoanAccountAssociationDetails(loanId, { skipCache });
    }
  }
}
