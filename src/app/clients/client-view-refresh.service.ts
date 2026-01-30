import { Injectable } from '@angular/core';

/**
 * Signals the client view to refetch when returning from activate/reactivate (or other actions).
 * Set before navigating back; consumed by ClientsViewComponent on init.
 */
@Injectable({
  providedIn: 'root'
})
export class ClientViewRefreshService {
  private shouldRefresh = false;

  setShouldRefresh(): void {
    this.shouldRefresh = true;
  }

  consumeShouldRefresh(): boolean {
    const value = this.shouldRefresh;
    this.shouldRefresh = false;
    return value;
  }
}
