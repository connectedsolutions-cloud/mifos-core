/** Angular Imports */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/** Routing Imports */
import { Route } from '../core/route/route.service';

/** Custom Components */
import { TellerComponent } from './teller.component';
import { OperacionesComponent } from './operaciones/operaciones.component';
import { DesembolsosComponent } from './desembolsos/desembolsos.component';
import { PagosComponent } from './pagos/pagos.component';
/** Teller Routes */
const routes: Routes = [
  Route.withShell([
    {
      path: 'teller',
      component: TellerComponent,
      data: { title: 'Teller', breadcrumb: 'Teller' },
      children: [
        {
          path: '',
          redirectTo: 'operaciones',
          pathMatch: 'full'
        },
        {
          path: 'operaciones',
          component: OperacionesComponent,
          data: { title: 'Operaciones' }
        },
        {
          path: 'desembolsos',
          component: DesembolsosComponent,
          data: { title: 'Desembolsos' }
        },
        {
          path: 'pagos',
          component: PagosComponent,
          data: { title: 'Pagos' }
        }
      ]
    }
  ])

];

/**
 * Teller Routing Module
 *
 * Configures the teller and section routes.
 */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class TellerRoutingModule {}
