import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TreasuryService {
  private base = '/v1/treasury';

  constructor(private http: HttpClient) {}

  getBanks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/bankaccounts`);
  }

  getBankPicker(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/bankaccounts`, { params: new HttpParams().set('picker', 'true') });
  }

  createBank(body: any): Observable<any> {
    return this.http.post(`${this.base}/bankaccounts`, body);
  }

  getAssetDetailAccounts(): Observable<any[]> {
    const params = new HttpParams().set('type', '1').set('usage', '1').set('disabled', 'false');
    return this.http.get<any[]>('/glaccounts', { params });
  }

  bankLabel(bank: any): string {
    if (!bank) {
      return '';
    }
    return [
      bank.name,
      bank.alias,
      bank.externalAccountReference
    ]
      .filter((part) => !!part)
      .join(' · ');
  }

  updateBank(id: number, body: any): Observable<any> {
    return this.http.put(`${this.base}/bankaccounts/${id}`, body);
  }

  getMovements(
    bankId: number,
    filters?: { type?: string; payee?: string; fromDate?: string; toDate?: string }
  ): Observable<any[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.payee) params = params.set('payee', filters.payee);
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    return this.http.get<any[]>(`${this.base}/bankaccounts/${bankId}/movements`, { params });
  }

  createMovement(body: any): Observable<any> {
    return this.http.post(`${this.base}/movements`, body);
  }

  reverseMovement(id: number): Observable<any> {
    return this.http.post(`${this.base}/movements/${id}?command=reverse`, {});
  }

  getLink(linkType: string, entityId: number): Observable<any> {
    const params = new HttpParams().set('linkType', linkType).set('entityId', String(entityId));
    return this.http.get(`${this.base}/links`, { params });
  }

  matchBank(productType: string, productId: number, paymentTypeId: number): Observable<any> {
    const params = new HttpParams()
      .set('productType', productType)
      .set('productId', String(productId))
      .set('paymentTypeId', String(paymentTypeId));
    return this.http.get(`${this.base}/bankaccounts/match`, { params });
  }

  private chequeParams(filters: {
    number?: string;
    exact?: string;
    bank?: string;
    kind?: string;
    fromDate?: string;
    toDate?: string;
    amount?: string;
    sort?: string;
    order?: string;
  }): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(
      ([
        key,
        value
      ]) => {
        if (value) params = params.set(key, value);
      }
    );
    return params;
  }

  getHistoricalCheques(filters: Parameters<TreasuryService['chequeParams']>[0]): Observable<any[]> {
    return this.http.get<any[]>('/v1/cheques/history', { params: this.chequeParams(filters).set('limit', '1000') });
  }

  exportHistoricalCheques(filters: Parameters<TreasuryService['chequeParams']>[0]): Observable<Blob> {
    return this.http.get('/v1/cheques/history', {
      params: this.chequeParams(filters).set('export', 'csv'),
      responseType: 'blob'
    });
  }
}
