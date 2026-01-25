import { Injectable } from '@angular/core';

/**
 * Signals the employees list to refetch when returning from create (or dialog "back to list").
 * Set before navigating back; consumed by EmployeesComponent on init.
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeListRefreshService {
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
