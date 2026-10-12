import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Route } from '../core/route/route.service';
import { TreasuryComponent } from './treasury.component';
import { TreasuryAccessGuard } from './treasury-access.guard';

const routes: Routes = [
  Route.withShell([
    {
      path: 'treasury',
      data: { title: 'Treasury', breadcrumb: 'Treasury' },
      canActivate: [TreasuryAccessGuard],
      children: [{ path: '', component: TreasuryComponent }]
    }
  ])

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TreasuryRoutingModule {}
