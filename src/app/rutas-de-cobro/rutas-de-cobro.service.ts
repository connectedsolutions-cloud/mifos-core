import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RutasDeCobroService {
  private resourceUrl = '/v1/mobile-collection-routes';

  constructor(private http: HttpClient) {}

  getRoutes(skipCache?: boolean): Observable<any> {
    let params = new HttpParams();
    if (skipCache) {
      params = params.set('_', String(Date.now()));
    }
    const options = params.keys().length ? { params } : {};
    return this.http.get(this.resourceUrl, options);
  }

  getTemplate(skipCache?: boolean): Observable<any> {
    let params = new HttpParams();
    if (skipCache) {
      params = params.set('_', String(Date.now()));
    }
    const options = params.keys().length ? { params } : {};
    return this.http.get(`${this.resourceUrl}/template`, options);
  }

  getRoute(routeId: number, skipCache?: boolean): Observable<any> {
    let params = new HttpParams();
    if (skipCache) {
      params = params.set('_', String(Date.now()));
    }
    const options = params.keys().length ? { params } : {};
    return this.http.get(`${this.resourceUrl}/${routeId}`, options);
  }

  createRoute(data: any): Observable<any> {
    return this.http.post(this.resourceUrl, data);
  }

  updateRoute(routeId: number, data: any): Observable<any> {
    return this.http.put(`${this.resourceUrl}/${routeId}`, data);
  }

  deleteRoute(routeId: number): Observable<any> {
    return this.http.delete(`${this.resourceUrl}/${routeId}`);
  }
}
