/** Angular Imports */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/** Routing Imports */
import { Route } from '../core/route/route.service';

/** Custom Components */
import { HomeComponent } from './home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DtePrintPreviewComponent } from '../teller/invoice-widget/dte-print-preview.component';

/** Custom Resolvers */
import { OfficesResolver } from '../accounting/common-resolvers/offices.resolver';

/** Home and Dashboard Routes */
const routes: Routes = [
  Route.withShell([
    {
      path: '',
      redirectTo: '/home',
      pathMatch: 'full'
    },
    {
      path: 'home',
      component: HomeComponent,
      data: { title: 'Home' }
    },
    {
      path: 'dashboard',
      component: DashboardComponent,
      data: { title: 'Dashboard', breadcrumb: 'Dashboard' },
      resolve: {
        offices: OfficesResolver
      }
    },
    {
      path: 'dte-preview',
      data: { title: 'Vista previa DTE', breadcrumb: 'Vista previa DTE' },
      children: [
        {
          path: '',
          component: DtePrintPreviewComponent
        }
      ]
    }
  ])

];

/**
 * Home Routing Module
 *
 * Configures the home and dashboard routes.
 */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [OfficesResolver]
})
export class HomeRoutingModule {}
