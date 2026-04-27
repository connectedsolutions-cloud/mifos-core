/** Angular Imports */
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';

/** rxjs Imports */
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

/** Custom Services */
import { ClientsService } from '../clients.service';

/**
 * Clients data and template resolver.
 */
@Injectable()
export class ClientDataAndTemplateResolver {
  /**
   * @param {ClientsService} ClientsService Clients service.
   */
  constructor(private clientsService: ClientsService) {}

  /**
   * Returns the Clients data and template.
   * @returns {Observable<any>}
   */
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const clientId = route.paramMap.get('clientId');
    return this.clientsService.getClientDataAndTemplate(clientId, { skipCache: true }).pipe(
      switchMap((clientDataAndTemplate: any) => {
        if (clientDataAndTemplate?.datatables?.length) {
          return of(clientDataAndTemplate);
        }
        const officeId = clientDataAndTemplate?.officeId;
        const templateRequest = officeId
          ? this.clientsService.getClientWithOfficeTemplate(officeId)
          : this.clientsService.getClientTemplate();

        return templateRequest.pipe(
          map((clientTemplate: any) => ({
            ...clientDataAndTemplate,
            datatables: clientTemplate?.datatables || []
          })),
          // If template fallback fails, keep original payload so edit form still loads.
          catchError(() => of(clientDataAndTemplate))
        );
      })
    );
  }
}
