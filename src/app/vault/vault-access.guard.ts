import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthenticationService } from '../core/authentication/authentication.service';

/**
 * Guard that allows access to the vault route only when the user has the acceso_boveda permission.
 */
@Injectable({ providedIn: 'root' })
export class VaultAccessGuard implements CanActivate {
  private static readonly VAULT_PERMISSION = 'acceso_boveda';

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  canActivate(): boolean {
    const credentials = this.authenticationService.getCredentials();
    if (!credentials?.permissions) {
      this.router.navigate(['/home']);
      return false;
    }
    const permissions: string[] = credentials.permissions;
    if (permissions.includes('ALL_FUNCTIONS') || permissions.includes(VaultAccessGuard.VAULT_PERMISSION)) {
      return true;
    }
    this.router.navigate(['/home']);
    return false;
  }
}
