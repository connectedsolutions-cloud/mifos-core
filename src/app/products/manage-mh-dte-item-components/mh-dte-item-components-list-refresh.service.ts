import { Injectable } from '@angular/core';

/**
 * Signals the MH DTE item components list to refetch after create/update/delete navigations.
 * Set before navigating to the list; consumed by ManageMhDteItemComponentsComponent on init.
 * See docs/autorefresh_frontend.md.
 */
@Injectable({
  providedIn: 'root'
})
export class MhDteItemComponentsListRefreshService {
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
