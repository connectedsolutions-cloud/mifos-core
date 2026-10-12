/** Angular Imports */
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';

/** rxjs Imports */
import { Observable } from 'rxjs';

/** Custom Services */
import { ReportsService } from 'app/reports/reports.service';
import { SettingsService } from 'app/settings/settings.service';

/**
 * Loans Transaction Reciept resolver.
 */
@Injectable()
export class LoansTransactionRecieptResolver {
  /**
   * @param {ReportsService} reportsService Reports service.
   */
  constructor(
    private reportsService: ReportsService,
    private settingsService: SettingsService
  ) {}

  /**
   * Returns the Loans Transaction Reciept
   * @param {ActivatedRouteSnapshot} route Route Snapshot
   * @returns {Observable<any>}
   */
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const transactionId = route.paramMap.get('id');
    const data = {
      'output-type': 'PDF',
      R_transactionId: transactionId
    };
    return this.reportsService.getPentahoRunReportData(
      'Loan Transaction Receipt',
      data,
      this.settingsService.tenantIdentifier || 'default',
      'en',
      'dd MMMM yyyy'
    );
  }
}
