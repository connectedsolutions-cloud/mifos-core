import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientPendientesRefreshService {
  private readonly refreshed = new Subject<number>();
  readonly refreshed$ = this.refreshed.asObservable();

  notify(clientId: number): void {
    this.refreshed.next(Number(clientId));
  }
}
