import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../core/authentication/authentication.service';

@Injectable({ providedIn: 'root' })
export class TreasuryAccessGuard {
  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const credentials = this.authenticationService.getCredentials();
    const permissions: string[] = credentials?.permissions || [];
    if (permissions.includes('ALL_FUNCTIONS') || permissions.includes('READ_TREASURY')) {
      return true;
    }
    this.router.navigate(['/home'], { replaceUrl: true });
    return false;
  }
}
