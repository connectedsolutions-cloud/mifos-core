/** Angular Imports */
import { Injectable } from '@angular/core';

/** rxjs Imports */
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

/** Custom Services */
import { AccountingService } from '../accounting/accounting.service';
import { AuthenticationService } from '../core/authentication/authentication.service';

/** Financial activity type for Cash at Main Vault (CASH_AT_MAINVAULT) */
const VAULT_FINANCIAL_ACTIVITY_ID = 101;

/**
 * Vault service.
 * Resolves vault GL account, current office balance, and vault transactions.
 */
@Injectable({
  providedIn: 'root'
})
export class VaultService {
  constructor(
    private accountingService: AccountingService,
    private authenticationService: AuthenticationService
  ) {}

  /**
   * Current user's office id from credentials.
   */
  getCurrentOfficeId(): number | null {
    const credentials = this.authenticationService.getCredentials();
    const id = credentials?.officeId;
    return id != null ? Number(id) : null;
  }

  /**
   * Current user's office name from credentials.
   */
  getCurrentOfficeName(): string {
    const credentials = this.authenticationService.getCredentials();
    return credentials?.officeName ?? '';
  }

  /**
   * Resolves the GL account id mapped to CASH_AT_MAINVAULT (101).
   * API returns array of { id, financialActivityData: { id, name }, glAccountData: { id, name, glCode } }.
   */
  getVaultGlAccountId(): Observable<number | null> {
    return this.accountingService.getFinancialActivityAccounts().pipe(
      map((list: any) => {
        const items = Array.isArray(list) ? list : (list ?? []);
        const mapping = items.find((m: any) => {
          const activityId = m.financialActivityData?.id ?? m.financialActivityType?.id ?? m.financialActivityId;
          return activityId != null && Number(activityId) === VAULT_FINANCIAL_ACTIVITY_ID;
        });
        const glId = mapping?.glAccountData?.id ?? mapping?.glAccount?.id ?? mapping?.glAccountId;
        return glId != null ? Number(glId) : null;
      })
    );
  }

  /**
   * Fetches the latest running balance for the vault GL account in the given office.
   * Uses journal entries with runningBalance=true, orderBy=transactionDate DESC, limit=1.
   */
  getVaultBalance(officeId: number, glAccountId: number): Observable<number | null> {
    const filterBy = [
      { type: 'officeId', value: String(officeId) },
      { type: 'glAccountId', value: String(glAccountId) },
      { type: 'runningBalance', value: 'true' }
    ];
    return this.accountingService.getJournalEntries(filterBy, 'transactionDate', 'DESC', 0, 1).pipe(
      map((res: any) => {
        const items = res?.pageItems || [];
        const first = items[0];
        if (!first) return null;
        const balance =
          first.officeRunningBalance != null
            ? Number(first.officeRunningBalance)
            : first.runningBalance != null
              ? Number(first.runningBalance)
              : null;
        return balance;
      })
    );
  }

  /**
   * Fetches vault journal entries for the current office (transactions list).
   */
  getVaultTransactions(
    officeId: number,
    glAccountId: number,
    fromDate?: string,
    toDate?: string,
    offset: number = 0,
    limit: number = 50
  ): Observable<{ pageItems: any[]; totalFilteredRecords: number }> {
    const filterBy: any[] = [
      { type: 'officeId', value: String(officeId) },
      { type: 'glAccountId', value: String(glAccountId) },
      { type: 'runningBalance', value: 'true' }
    ];
    if (fromDate) filterBy.push({ type: 'fromDate', value: fromDate });
    if (toDate) filterBy.push({ type: 'toDate', value: toDate });
    return this.accountingService.getJournalEntries(filterBy, 'transactionDate', 'DESC', offset, limit).pipe(
      map((res: any) => ({
        pageItems: res?.pageItems || [],
        totalFilteredRecords: res?.totalFilteredRecords ?? 0
      }))
    );
  }

  /**
   * Loads vault data for the current office: balance and whether vault is configured.
   */
  getVaultDataForCurrentOffice(): Observable<{
    officeId: number | null;
    officeName: string;
    vaultGlAccountId: number | null;
    balance: number | null;
    hasVaultMapping: boolean;
  }> {
    const officeId = this.getCurrentOfficeId();
    const officeName = this.getCurrentOfficeName();
    if (officeId == null) {
      return of({
        officeId: null,
        officeName,
        vaultGlAccountId: null,
        balance: null,
        hasVaultMapping: false
      });
    }
    return this.getVaultGlAccountId().pipe(
      switchMap((glAccountId) => {
        if (glAccountId == null) {
          return of({
            officeId,
            officeName,
            vaultGlAccountId: null,
            balance: null,
            hasVaultMapping: false
          });
        }
        return this.getVaultBalance(officeId, glAccountId).pipe(
          map((balance) => ({
            officeId,
            officeName,
            vaultGlAccountId: glAccountId,
            balance,
            hasVaultMapping: true
          }))
        );
      })
    );
  }
}
