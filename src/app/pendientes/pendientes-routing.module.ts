import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Route } from '../core/route/route.service';
import { PendientesDashboardComponent } from './pendientes-dashboard/pendientes-dashboard.component';
import { FlowDetailComponent } from './flow-detail/flow-detail.component';
import { CreateFlowComponent } from './create-flow/create-flow.component';
import { BlueprintsListComponent } from './blueprints-list/blueprints-list.component';

const routes: Routes = [
  Route.withShell([
    {
      path: 'pendientes',
      data: { title: 'Pendientes', breadcrumb: 'Pendientes' },
      children: [
        { path: '', component: PendientesDashboardComponent },
        { path: 'flows/create', component: CreateFlowComponent, data: { title: 'New Flow', breadcrumb: 'New Flow' } },
        { path: 'flows/:id', component: FlowDetailComponent, data: { title: 'Flow Detail', breadcrumb: 'Flow' } },
        {
          path: 'blueprints',
          component: BlueprintsListComponent,
          data: { title: 'Blueprints', breadcrumb: 'Blueprints' }
        }
      ]
    }
  ])

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PendientesRoutingModule {}
