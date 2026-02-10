/** Angular Imports */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** rxjs Imports */
import { Observable, of, Subject, merge } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

/**
 * Represents the active cashier session returned by the backend.
 */
export interface CashierSession {
  id: number;
  cashierId: number;
  tellerId: number;
  staffId: number;
  staffName?: string;
  tellerName?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Service for fetching the current user's active cashier session from the backend.
 * Decouples cashier session from authentication credentials.
 */
@Injectable({
  providedIn: 'root'
})
export class CashierSessionService {
  private readonly refresh$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  /**
   * Fetches the active (open) cashier session for the currently authenticated user.
   * Re-emits when refreshSession() is called.
   * @returns Observable of CashierSession or null if no active session (404/error)
   */
  getActiveSession(): Observable<CashierSession | null> {
    const fetchSession = (): Observable<CashierSession | null> =>
      this.http.get<CashierSession>('/cashiers/session').pipe(
        map((data) => this.toCashierSession(data)),
        catchError(() => of(null))
      );

    return merge(fetchSession(), this.refresh$.pipe(switchMap(() => fetchSession())));
  }

  /**
   * Triggers a refetch of the active session (e.g. after opening a till).
   */
  refreshSession(): void {
    this.refresh$.next();
  }

  private toCashierSession(data: any): CashierSession | null {
    if (!data) {
      return null;
    }
    const id = data.id ?? data.cashierId;
    if (id == null) {
      return null;
    }
    return {
      id,
      cashierId: id,
      tellerId: data.tellerId,
      staffId: data.staffId,
      staffName: data.staffName,
      tellerName: data.tellerName,
      startDate: data.startDate,
      endDate: data.endDate
    };
  }
}
