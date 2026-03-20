/** Angular Imports */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

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
   * Re-emits when refreshSession() is called. Use skipCache when refetching after a
   * mutation (e.g. close till) so the GET is not served from cache.
   */
  getActiveSession(options?: { skipCache?: boolean }): Observable<CashierSession | null> {
    const skipCache = options?.skipCache === true;
    return merge(this.fetchSession(skipCache), this.refresh$.pipe(switchMap(() => this.fetchSession(true))));
  }

  /**
   * Triggers a refetch of the active session (e.g. after opening or closing a till).
   */
  refreshSession(): void {
    this.refresh$.next();
  }

  private fetchSession(skipCache?: boolean): Observable<CashierSession | null> {
    let params = new HttpParams();
    if (skipCache) {
      params = params.set('_', String(Date.now()));
    }
    const opts = params.keys().length ? { params } : {};
    return this.http.get<CashierSession>('/cashiers/session', opts).pipe(
      map((data) => this.toCashierSession(data)),
      catchError(() => of(null))
    );
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
