import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PendientesService {
  private blueprintsUrl = '/v1/pending-flow-blueprints';
  private flowsUrl = '/v1/pending-flows';
  private stepsUrl = '/v1/pending-steps';

  constructor(private http: HttpClient) {}

  getBlueprints(): Observable<any> {
    return this.http.get(this.blueprintsUrl);
  }

  getBlueprint(id: number): Observable<any> {
    return this.http.get(`${this.blueprintsUrl}/${id}`);
  }

  createBlueprint(body: any): Observable<any> {
    return this.http.post(this.blueprintsUrl, body);
  }

  updateBlueprint(id: number, body: any): Observable<any> {
    return this.http.put(`${this.blueprintsUrl}/${id}`, body);
  }

  getFlows(blueprintId?: number, creatorId?: number, status?: string): Observable<any> {
    let params = new HttpParams();
    if (blueprintId != null) params = params.set('blueprintId', String(blueprintId));
    if (creatorId != null) params = params.set('creatorId', String(creatorId));
    if (status != null && status !== '') params = params.set('status', status);
    const options = params.keys().length ? { params } : {};
    return this.http.get(this.flowsUrl, options);
  }

  getFlow(id: number, includeSteps = true): Observable<any> {
    const params = new HttpParams().set('includeSteps', String(includeSteps));
    return this.http.get(`${this.flowsUrl}/${id}`, { params });
  }

  createFlow(blueprintId: number, body: any): Observable<any> {
    const payload = { ...body, blueprintId };
    return this.http.post(this.flowsUrl, payload);
  }

  getStepsByFlow(flowId: number): Observable<any> {
    const params = new HttpParams().set('flowId', String(flowId));
    return this.http.get(this.stepsUrl, { params });
  }

  getMySteps(): Observable<any> {
    const params = new HttpParams().set('mySteps', 'true');
    return this.http.get(this.stepsUrl, { params });
  }

  getMyCompletedSteps(officeId?: number): Observable<any> {
    let params = new HttpParams().set('mySteps', 'true').set('closed', 'true');
    if (officeId != null) params = params.set('officeId', String(officeId));
    return this.http.get(this.stepsUrl, { params });
  }

  getStep(id: number): Observable<any> {
    return this.http.get(`${this.stepsUrl}/${id}`);
  }

  updateStep(id: number, body: any): Observable<any> {
    return this.http.put(`${this.stepsUrl}/${id}`, body);
  }

  completeStep(
    id: number,
    body?: {
      note?: string;
      nextStep?: {
        responsableUserId?: number;
        dueDate?: string | Date;
        officeId?: number;
        description?: string;
      };
    }
  ): Observable<any> {
    let payload: any = body ?? {};
    if (payload.nextStep?.dueDate instanceof Date) {
      const d = payload.nextStep.dueDate as Date;
      payload = {
        ...payload,
        nextStep: {
          ...payload.nextStep,
          dueDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0).toISOString()
        }
      };
    }
    return this.http.post(`${this.stepsUrl}/${id}?command=complete`, payload);
  }

  cancelStep(id: number): Observable<any> {
    return this.http.post(`${this.stepsUrl}/${id}?command=cancel`, {});
  }
}
