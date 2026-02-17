import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../core/authentication/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class ComiteOtorgamientoService {
  private resourceUrl = '/v1/comite-otorgamiento';

  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService
  ) {}

  getSessions(skipCache?: boolean): Observable<any> {
    let params = new HttpParams();
    if (skipCache) {
      params = params.set('_', String(Date.now()));
    }
    const options = params.keys().length ? { params } : {};
    return this.http.get(`${this.resourceUrl}`, options);
  }

  getSession(sessionId: number, skipCache?: boolean): Observable<any> {
    let params = new HttpParams();
    if (skipCache) {
      params = params.set('_', String(Date.now()));
    }
    const options = params.keys().length ? { params } : {};
    return this.http.get(`${this.resourceUrl}/${sessionId}`, options);
  }

  getApprovedLoansDisbursementSum(
    sessionId: number,
    officeId?: number
  ): Observable<{ totalDisbursementAmount: number; currencyCode?: string; currencyDigits?: number }> {
    let params = new HttpParams();
    if (officeId != null && officeId !== 0) {
      params = params.set('officeId', String(officeId));
    }
    const options = params.keys().length ? { params } : {};
    return this.http.get(`${this.resourceUrl}/${sessionId}/approved-loans-disbursement-sum`, options) as Observable<{
      totalDisbursementAmount: number;
      currencyCode?: string;
      currencyDigits?: number;
    }>;
  }

  getPendingLoans(): Observable<any> {
    // Get the current logged-in user's office ID
    const credentials = this.authenticationService.getCredentials();
    const currentOfficeId = credentials?.officeId;

    let params = new HttpParams();
    if (currentOfficeId != null && currentOfficeId !== 0) {
      params = params.set('current_office_id', String(currentOfficeId));
    }

    return this.http.get(`${this.resourceUrl}/pending-loans`, { params });
  }

  createSession(data: any): Observable<any> {
    return this.http.post(`${this.resourceUrl}`, data);
  }

  updateSession(sessionId: number, data: any): Observable<any> {
    return this.http.put(`${this.resourceUrl}/${sessionId}`, data);
  }

  startSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.resourceUrl}/${sessionId}?command=start`, {});
  }

  updateSelections(sessionId: number, data: any): Observable<any> {
    return this.http.post(`${this.resourceUrl}/${sessionId}?command=updateSelections`, data);
  }

  submitSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.resourceUrl}/${sessionId}?command=submit`, {});
  }

  applySession(sessionId: number): Observable<any> {
    console.debug('[COMTE-DEBUG] POST apply session', { url: `${this.resourceUrl}/${sessionId}?command=apply` });
    return this.http.post(`${this.resourceUrl}/${sessionId}?command=apply`, {});
  }

  closeSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.resourceUrl}/${sessionId}?command=close`, {});
  }
}
