import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Route } from '../core/route/route.service';
import { RutasDeCobroComponent } from './rutas-de-cobro.component';
import { RutaDeCobroFormComponent } from './ruta-de-cobro-form/ruta-de-cobro-form.component';

const routes: Routes = [
  Route.withShell([
    {
      path: 'rutas-de-cobro',
      data: { title: 'Rutas de Cobro', breadcrumb: 'Rutas de Cobro' },
      children: [
        {
          path: '',
          component: RutasDeCobroComponent
        },
        {
          path: 'create',
          component: RutaDeCobroFormComponent,
          data: { title: 'Create Collection Route', breadcrumb: 'Create' }
        },
        {
          path: ':id/edit',
          component: RutaDeCobroFormComponent,
          data: { title: 'Edit Collection Route', breadcrumb: 'Edit' }
        }
      ]
    }
  ])

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RutasDeCobroRoutingModule {}
