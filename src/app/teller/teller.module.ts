/** Angular Imports */
import { NgModule } from '@angular/core';

/** Custom Modules */
import { SharedModule } from '../shared/shared.module';
import { TellerRoutingModule } from './teller-routing.module';

/** Custom Components */
import { TellerComponent } from './teller.component';
import { CajaDefaultViewComponent } from './caja-default-view/caja-default-view.component';
import { AperturarCajaDialogComponent } from './aperturar-caja-dialog/aperturar-caja-dialog.component';
import { OperacionesComponent } from './operaciones/operaciones.component';
import { DesembolsosComponent } from './desembolsos/desembolsos.component';
import { PagosComponent } from './pagos/pagos.component';

/**
 * Teller Module
 *
 * Teller/cashier operations: default view (Aperturar caja), Operaciones, Desembolsos, Pagos.
 */
@NgModule({
  imports: [
    SharedModule,
    TellerRoutingModule,
    TellerComponent,
    CajaDefaultViewComponent,
    AperturarCajaDialogComponent,
    OperacionesComponent,
    DesembolsosComponent,
    PagosComponent
  ]
})
export class TellerModule {}
