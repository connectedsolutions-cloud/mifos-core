/** Angular Imports */
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

/** rxjs Imports */
import { Observable } from 'rxjs';

/** Custom Imports */
import { environment } from '../../../environments/environment';
import { SettingsService } from 'app/settings/settings.service';

/** Http request (default) options headers. */
const httpOptions: { headers: { [key: string]: string } } = {
  headers: {
    'Fineract-Platform-TenantId': environment.fineractPlatformTenantId
  }
};

/** Authorization header. */
const authorizationHeader = 'Authorization';
const authorizationTenantHeader = 'Fineract-Platform-TenantId';
/** Two factor access token header. */
const twoFactorAccessTokenHeader = 'Fineract-Platform-TFA-Token';
/** Impersonation header: admin stays on Basic auth, effective user is swapped server-side. */
const impersonationHeader = 'Fineract-Platform-Impersonate-User';

/**
 * Http Request interceptor to set the request headers.
 */
@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  constructor(private settingsService: SettingsService) {}

  /**
   * Intercepts a Http request and sets the request headers.
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.settingsService.tenantIdentifier) {
      httpOptions.headers['Fineract-Platform-TenantId'] = this.settingsService.tenantIdentifier;
    }
    const headers = { ...httpOptions.headers };
    if (request.url.includes('/passwordreset')) {
      delete headers[authorizationHeader];
    }
    request = request.clone({ setHeaders: headers });
    return next.handle(request);
  }

  /**
   * Sets the basic/oauth authorization header depending on the configuration.
   * @param {string} authenticationKey Authentication key.
   */
  setAuthorizationToken(authenticationKey: string) {
    if (environment.oauth.enabled) {
      httpOptions.headers[authorizationHeader] = `Bearer ${authenticationKey}`;
    } else {
      httpOptions.headers[authorizationHeader] = `Basic ${authenticationKey}`;
    }
  }

  /**
   * Sets the two factor access token header.
   * @param {string} twoFactorAccessToken Two factor access token.
   */
  setTwoFactorAccessToken(twoFactorAccessToken: string) {
    httpOptions.headers[twoFactorAccessTokenHeader] = twoFactorAccessToken;
  }

  /**
   * Removes the authorization header.
   */
  removeAuthorization() {
    delete httpOptions.headers[authorizationHeader];
    this.removeImpersonateUser();
  }

  /**
   * Removes the authorization header.
   */
  removeAuthorizationTenant() {
    delete httpOptions.headers[authorizationHeader];
    delete httpOptions.headers[authorizationTenantHeader];
  }

  /**
   * Sets the impersonation header so the API treats subsequent requests as the target user.
   */
  setImpersonateUser(userId: number) {
    httpOptions.headers[impersonationHeader] = String(userId);
  }

  /**
   * Removes the impersonation header.
   */
  removeImpersonateUser() {
    delete httpOptions.headers[impersonationHeader];
  }

  /**
   * Removes the two factor access token header.
   */
  removeTwoFactorAuthorization() {
    delete httpOptions.headers[twoFactorAccessTokenHeader];
  }
}
