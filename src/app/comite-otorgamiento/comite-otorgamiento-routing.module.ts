import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/** Routing Imports */
import { Route } from '../core/route/route.service';

/** Custom Components */
import { ComiteOtorgamientoComponent } from './comite-otorgamiento.component';
import { EditSesionComiteComponent } from './edit-sesion-comite/edit-sesion-comite.component';

/** Comite Otorgamiento Routes */
const routes: Routes = [
  Route.withShell([
    {
      path: 'comite-otorgamiento',
      data: { title: 'Comite Otorgamiento', breadcrumb: 'Comite Otorgamiento' },
      children: [
        {
          path: '',
          component: ComiteOtorgamientoComponent
        },
        {
          path: ':id/edit',
          component: EditSesionComiteComponent,
          data: { title: 'Edit Session', breadcrumb: 'Edit' }
        }
      ]
    }
  ])

];

/**
 * Comite Otorgamiento Routing Module
 */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComiteOtorgamientoRoutingModule {}
