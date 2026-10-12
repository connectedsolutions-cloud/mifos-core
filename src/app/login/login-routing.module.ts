/** Angular Imports */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/** Custom Components */
import { LoginComponent } from './login.component';

/** Login Routes */
const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login' }
  },
  {
    path: 'forgot-password',
    component: LoginComponent,
    data: { title: 'Forgot Password' }
  },
  {
    path: 'reset-password',
    component: LoginComponent,
    data: { title: 'Reset Password' }
  }
];

/**
 * Login Routing Module
 *
 * Configures the login routes.
 */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class LoginRoutingModule {}
