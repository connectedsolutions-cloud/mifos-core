import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendientesRoutingModule } from './pendientes-routing.module';
import { PendientesDashboardComponent } from './pendientes-dashboard/pendientes-dashboard.component';
import { FlowDetailComponent } from './flow-detail/flow-detail.component';
import { CreateFlowComponent } from './create-flow/create-flow.component';
import { BlueprintsListComponent } from './blueprints-list/blueprints-list.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    PendientesRoutingModule,
    PendientesDashboardComponent,
    FlowDetailComponent,
    CreateFlowComponent,
    BlueprintsListComponent,
    TranslateModule
  ]
})
export class PendientesModule {}
