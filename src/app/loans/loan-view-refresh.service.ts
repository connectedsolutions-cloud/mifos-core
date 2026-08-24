import { Injectable } from '@angular/core';

/**
 * Signals the loan view to refetch when returning from repayment (or other actions).
 * Set before navigating back; peeked by LoanDetailsResolver for cache-bust,
 * consumed by LoansViewComponent on init.
 * See docs/autorefresh_frontend.md.
 */
@Injectable({
  providedIn: 'root'
})
export class LoanViewRefreshService {
  private shouldRefresh = false;

  setShouldRefresh(): void {
    this.shouldRefresh = true;
  }

  /** Peek without clearing — resolvers may run more than once for the same navigation. */
  isShouldRefresh(): boolean {
    return this.shouldRefresh;
  }

  consumeShouldRefresh(): boolean {
    const value = this.shouldRefresh;
    this.shouldRefresh = false;
    return value;
  }
}
