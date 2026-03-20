import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Route } from '../core/route/route.service';
import { VaultComponent } from './vault.component';
import { VaultAccessGuard } from './vault-access.guard';

const routes: Routes = [
  Route.withShell([
    {
      path: 'vault',
      data: { title: 'Vault', breadcrumb: 'Vault' },
      canActivate: [VaultAccessGuard],
      children: [
        {
          path: '',
          component: VaultComponent
        }
      ]
    }
  ])

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VaultRoutingModule {}
