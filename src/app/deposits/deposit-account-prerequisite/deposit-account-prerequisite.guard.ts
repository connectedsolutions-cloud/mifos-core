import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ClientsService } from 'app/clients/clients.service';
import { DepositAccountPrerequisiteDialogComponent } from './deposit-account-prerequisite-dialog.component';
import { hasApprovedShareAccount } from './deposit-account-prerequisite';

const DIALOG_ID = 'deposit-account-prerequisite';

/**
 * Blocks fixed and recurring deposit applications until the client has an
 * approved or active share account, and explains the required order.
 */
@Injectable({ providedIn: 'root' })
export class DepositAccountPrerequisiteGuard implements CanActivate {
  constructor(
    private clientsService: ClientsService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const clientId = this.clientIdFrom(route);
    if (!clientId) {
      return of(true);
    }

    return this.clientsService.getClientAccountData(clientId).pipe(
      map((data: { shareAccounts?: { status?: { code?: string } }[] }) => {
        if (hasApprovedShareAccount(data?.shareAccounts)) {
          return true;
        }
        this.openDialog();
        return this.router.createUrlTree([
          '/clients',
          clientId,
          'general'
        ]);
      }),
      catchError(() => {
        this.openDialog();
        return of(
          this.router.createUrlTree([
            '/clients',
            clientId,
            'general'
          ])
        );
      })
    );
  }

  private openDialog(): void {
    if (this.dialog.getDialogById(DIALOG_ID)) {
      return;
    }
    this.dialog.open(DepositAccountPrerequisiteDialogComponent, {
      id: DIALOG_ID,
      width: '32rem',
      autoFocus: 'dialog'
    });
  }

  private clientIdFrom(route: ActivatedRouteSnapshot): string | null {
    let current: ActivatedRouteSnapshot | null = route;
    while (current) {
      const clientId = current.paramMap.get('clientId');
      if (clientId) {
        return clientId;
      }
      current = current.parent;
    }
    return null;
  }
}
