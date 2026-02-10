/** Angular Imports */
import { Component } from '@angular/core';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { CashierSessionService } from './cashier-session.service';
import { CajaDefaultViewComponent } from './caja-default-view/caja-default-view.component';

/**
 * Teller component.
 * Shell for teller/cashier operations. When no active cashier session, shows default view (Aperturar caja).
 * When session exists, shows centered top nav (Operaciones, Desembolsos, Pagos).
 */
@Component({
  selector: 'mifosx-teller',
  templateUrl: './teller.component.html',
  styleUrls: ['./teller.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTabNav,
    MatTabLink,
    RouterLinkActive,
    MatTabNavPanel,
    RouterOutlet,
    CajaDefaultViewComponent
  ]
})
export class TellerComponent {
  /** True when the user has an active cashier session (has opened a till). */
  hasCashierSession$: Observable<boolean> = this.cashierSessionService
    .getActiveSession()
    .pipe(map((session) => !!session));

  constructor(private cashierSessionService: CashierSessionService) {}
}
