/** Angular Imports */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

/** rxjs Imports */
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

/** Custom Services */
import { AlertService } from '../alert/alert.service';

/** Custom Interceptors */
import { AuthenticationInterceptor } from './authentication.interceptor';

/** Environment Configuration */
import { environment } from '../../../environments/environment';

/** Custom Models */
import { LoginContext } from './login-context.model';
import { Credentials } from './credentials.model';
import { OAuth2Token } from './o-auth2-token.model';

/**
 * Authentication workflow.
 */
@Injectable()
export class AuthenticationService {
  changePassword(userId: string, passwordObj: any) {
    return this.http.put(`/users/${userId}`, passwordObj);
  }
  // User logged in boolean
  private userLoggedIn: boolean;
  private userLoggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$ = this.userLoggedIn$.asObservable();

  /** Denotes whether the user credentials should persist through sessions. */
  private rememberMe: boolean;
  /**
   * Denotes the type of storage:
   *
   * Session Storage: User credentials should not persist through sessions.
   *
   * Local Storage: User credentials should persist through sessions.
   */
  private storage: any;
  /** User credentials. */

  private credentials: Credentials;
  private dialogShown = false;
  /** Key to store credentials in storage. */
  private credentialsStorageKey = 'mifosXCredentials';
  /** Key to store oauth token details in storage. */
  private oAuthTokenDetailsStorageKey = 'mifosXOAuthTokenDetails';
  /** Key to store two factor authentication token in storage. */
  private twoFactorAuthenticationTokenStorageKey = 'mifosXTwoFactorAuthenticationToken';
  /** Snapshot of the real admin credentials while impersonating. */
  private originalCredentialsStorageKey = 'mifosXOriginalCredentials';
  /** Impersonation metadata (target user). */
  private impersonationStorageKey = 'mifosXImpersonation';

  /**
   * Initializes the type of storage and authorization headers depending on whether
   * credentials are presently in storage or not.
   * @param {HttpClient} http Http Client to send requests.
   * @param {AlertService} alertService Alert Service.
   * @param {AuthenticationInterceptor} authenticationInterceptor Authentication Interceptor.
   */
  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private authenticationInterceptor: AuthenticationInterceptor
  ) {
    this.userLoggedIn = false;
    this.rememberMe = false;
    this.storage = sessionStorage;
    const credentialsRaw =
      sessionStorage.getItem(this.credentialsStorageKey) || localStorage.getItem(this.credentialsStorageKey);
    const savedCredentials = credentialsRaw ? JSON.parse(credentialsRaw) : null;
    if (savedCredentials) {
      this.rememberMe = !!savedCredentials.rememberMe;
      const credentialsInLocalOnly =
        !sessionStorage.getItem(this.credentialsStorageKey) && !!localStorage.getItem(this.credentialsStorageKey);
      this.storage = this.rememberMe || credentialsInLocalOnly ? localStorage : sessionStorage;
      const twoFactorRaw =
        sessionStorage.getItem(this.twoFactorAuthenticationTokenStorageKey) ||
        localStorage.getItem(this.twoFactorAuthenticationTokenStorageKey);
      const twoFactorAccessToken = twoFactorRaw ? JSON.parse(twoFactorRaw) : null;
      if (environment.oauth.enabled) {
        this.refreshOAuthAccessToken();
      } else {
        authenticationInterceptor.setAuthorizationToken(savedCredentials.base64EncodedAuthenticationKey);
      }
      if (twoFactorAccessToken) {
        authenticationInterceptor.setTwoFactorAccessToken(twoFactorAccessToken.token);
      }
      const impersonation = this.getImpersonationState();
      if (impersonation?.targetUserId) {
        authenticationInterceptor.setImpersonateUser(impersonation.targetUserId);
      }
      // Emit the correct initial state
      this.userLoggedIn = true;
      this.userLoggedIn$.next(true);
    }
  }

  /**
   * Authenticates the user.
   * @param {LoginContext} loginContext Login parameters.
   * @returns {Observable<boolean>} True if authentication is successful.
   */
  login(loginContext: LoginContext) {
    this.alertService.alert({ type: 'Authentication Start', message: 'Please wait...' });
    // Only allow Remember Me if enabled in config
    const rememberAllowed = environment.enableRememberMe === true;
    this.rememberMe = rememberAllowed ? loginContext.remember : false;
    this.storage = this.rememberMe ? localStorage : sessionStorage;

    if (environment.oauth.enabled) {
      let httpParams = new HttpParams();
      httpParams = httpParams.set('username', loginContext.username);
      httpParams = httpParams.set('password', loginContext.password);
      httpParams = httpParams.set('client_id', `${environment.oauth.appId}`);
      httpParams = httpParams.set('grant_type', 'password');
      httpParams = httpParams.set('remember_me', this.rememberMe ? 'true' : 'false');
      let headers = new HttpHeaders();
      headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
      return this.http.post(`${environment.oauth.serverUrl}/token`, httpParams.toString(), { headers: headers }).pipe(
        map((tokenResponse: OAuth2Token) => {
          this.getUserDetails(tokenResponse);
          return of(true);
        })
      );
    } else {
      return this.http
        .post('/authentication', {
          username: loginContext.username,
          password: loginContext.password,
          remember: this.rememberMe
        })
        .pipe(
          map((credentials: Credentials) => {
            this.onLoginSuccess(credentials);
            return of(true);
          })
        );
    }
  }

  /**
   * Retrieves the user details after oauth2 authentication.
   *
   * Sets the oauth2 token refresh time.
   * @param {OAuth2Token} tokenResponse OAuth2 Token details.
   */
  private getUserDetails(tokenResponse: OAuth2Token) {
    this.refreshTokenOnExpiry(tokenResponse.expires_in);
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', 'bearer ' + tokenResponse.access_token);
    this.http
      .get(`${environment.serverUrl}/userdetails`, { headers: headers })
      .subscribe((credentials: Credentials) => {
        this.onLoginSuccess(credentials);
        if (!credentials.shouldRenewPassword) {
          this.storage.setItem(this.oAuthTokenDetailsStorageKey, JSON.stringify(tokenResponse));
        }
      });
  }

  /**
   * Sets the oauth2 token to refresh on expiry.
   * @param {number} expiresInTime OAuth2 token expiry time in seconds.
   */
  private refreshTokenOnExpiry(expiresInTime: number) {
    setTimeout(() => this.refreshOAuthAccessToken(), expiresInTime * 1000);
  }

  /**
   * Refreshes the oauth2 authorization token.
   */
  private refreshOAuthAccessToken() {
    var oAuthRefreshToken = JSON.parse(this.storage.getItem(this.oAuthTokenDetailsStorageKey));
    if (oAuthRefreshToken == null) {
      return;
    }
    oAuthRefreshToken = JSON.parse(this.storage.getItem(this.oAuthTokenDetailsStorageKey)).refresh_token;
    this.authenticationInterceptor.removeAuthorization();
    const credentials = JSON.parse(this.storage.getItem(this.credentialsStorageKey));
    let httpParams = new HttpParams();
    httpParams = httpParams.set('username', credentials.username);
    httpParams = httpParams.set('client_id', `${environment.oauth.appId}`);
    httpParams = httpParams.set('refresh_token', oAuthRefreshToken);
    httpParams = httpParams.set('grant_type', 'refresh_token');
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
    return this.http
      .post(`${environment.oauth.serverUrl}/token`, httpParams.toString(), { headers: headers })
      .subscribe((tokenResponse: OAuth2Token) => {
        this.storage.setItem(this.oAuthTokenDetailsStorageKey, JSON.stringify(tokenResponse));
        this.authenticationInterceptor.setAuthorizationToken(tokenResponse.access_token);
        this.refreshTokenOnExpiry(tokenResponse.expires_in);
        const credentials = JSON.parse(this.storage.getItem(this.credentialsStorageKey));
        credentials.accessToken = tokenResponse.access_token;
        this.storage.setItem(this.credentialsStorageKey, JSON.stringify(credentials));
      });
  }

  /**
   * Sets the authorization token followed by one of the following:
   *
   * Sends an alert if two factor authentication is required.
   *
   * Sends an alert if password has expired and requires a reset.
   *
   * Sends an alert on successful login.
   * @param {Credentials} credentials Authenticated user credentials.
   */
  private onLoginSuccess(credentials: Credentials) {
    this.userLoggedIn = true;
    this.userLoggedIn$.next(true); // ✅ notify observers
    // Ensure the rememberMe value is preserved in credentials
    credentials.rememberMe = this.rememberMe;

    if (environment.oauth.enabled) {
      this.authenticationInterceptor.setAuthorizationToken(credentials.accessToken);
    } else {
      this.authenticationInterceptor.setAuthorizationToken(credentials.base64EncodedAuthenticationKey);
    }
    if (credentials.isTwoFactorAuthenticationRequired) {
      this.credentials = credentials;
      this.alertService.alert({
        type: 'Two Factor Authentication Required',
        message: 'Two Factor Authentication Required'
      });
    } else {
      if (credentials.shouldRenewPassword) {
        this.credentials = credentials;
        this.alertService.alert({
          type: 'Password Expired',
          message: 'Your password has expired, please reset your password!'
        });
      } else {
        this.setCredentials(credentials);
        this.alertService.alert({
          type: 'Authentication Success',
          message: `${credentials.username} successfully logged in!`
        });
        delete this.credentials;
      }
    }
  }

  /**
   * Logout ongoing Oauth2 session.
   */
  private logoutAuthSession() {
    const oAuthRefreshToken = JSON.parse(this.storage.getItem(this.oAuthTokenDetailsStorageKey)).refresh_token;
    const credentials = JSON.parse(this.storage.getItem(this.credentialsStorageKey));
    this.authenticationInterceptor.removeAuthorizationTenant();
    let httpParams = new HttpParams();
    httpParams = httpParams.set('username', credentials.username);
    httpParams = httpParams.set('client_id', `${environment.oauth.appId}`);
    httpParams = httpParams.set('refresh_token', oAuthRefreshToken);
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
    return this.http
      .post(`${environment.oauth.serverUrl}/logout`, httpParams.toString(), { headers: headers })
      .subscribe();
  }

  /**
   * Logs out the authenticated user and clears the credentials from storage.
   * @returns {Observable<boolean>} True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    const twoFactorToken = JSON.parse(this.storage.getItem(this.twoFactorAuthenticationTokenStorageKey));
    if (twoFactorToken) {
      this.http.post('/twofactor/invalidate', { token: twoFactorToken.token }).subscribe();
      this.authenticationInterceptor.removeTwoFactorAuthorization();
    }
    const oAuthRefreshToken = JSON.parse(this.storage.getItem(this.oAuthTokenDetailsStorageKey));
    if (oAuthRefreshToken) {
      this.logoutAuthSession();
    }
    this.authenticationInterceptor.removeAuthorization();
    this.clearImpersonationState();
    this.setCredentials();
    this.resetDialog();
    this.userLoggedIn = false;
    this.userLoggedIn$.next(false); // ✅ notify observers
    return of(true);
  }

  /**
   * Checks if the two factor access token for authenticated user is valid.
   * @returns {boolean} True if the two factor access token is valid or two factor authentication is not required.
   */
  twoFactorAccessTokenIsValid(): boolean {
    const twoFactorRaw =
      sessionStorage.getItem(this.twoFactorAuthenticationTokenStorageKey) ||
      localStorage.getItem(this.twoFactorAuthenticationTokenStorageKey);
    const twoFactorAccessToken = twoFactorRaw ? JSON.parse(twoFactorRaw) : null;
    if (twoFactorAccessToken) {
      return new Date().getTime() < twoFactorAccessToken.validTo;
    }
    return true;
  }

  /**
   * Checks if the user is authenticated.
   * @returns {boolean} True if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!(
      JSON.parse(
        sessionStorage.getItem(this.credentialsStorageKey) || localStorage.getItem(this.credentialsStorageKey)
      ) && this.twoFactorAccessTokenIsValid()
    );
  }

  /**
   * Gets the user credentials.
   * @returns {Credentials} The user credentials if the user is authenticated otherwise null.
   */
  getCredentials(): Credentials | null {
    const raw = sessionStorage.getItem(this.credentialsStorageKey) || localStorage.getItem(this.credentialsStorageKey);
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Sets the user credentials.
   *
   * The credentials may be persisted across sessions by setting the `rememberMe` parameter to true.
   * Otherwise, the credentials are only persisted for the current session.
   *
   * @param {Credentials} credentials Authenticated user credentials.
   */
  private setCredentials(credentials?: Credentials) {
    if (credentials) {
      credentials.rememberMe = this.rememberMe;
      // Make sure we're using the correct storage based on rememberMe value
      this.storage = credentials.rememberMe ? localStorage : sessionStorage;
      this.storage.setItem(this.credentialsStorageKey, JSON.stringify(credentials));
    } else {
      // Clear credentials from both storage types to ensure complete logout
      localStorage.removeItem(this.credentialsStorageKey);
      sessionStorage.removeItem(this.credentialsStorageKey);
      localStorage.removeItem(this.oAuthTokenDetailsStorageKey);
      sessionStorage.removeItem(this.oAuthTokenDetailsStorageKey);
      localStorage.removeItem(this.twoFactorAuthenticationTokenStorageKey);
      sessionStorage.removeItem(this.twoFactorAuthenticationTokenStorageKey);
      this.clearImpersonationState();
    }
  }

  public saveZitadelCredentials(credentials: Credentials): void {
    this.setCredentials(credentials);
  }

  public saveZitadeloAuthTokenDetailsStorageKey(tokenResponse: OAuth2Token): void {
    this.storage.setItem(this.oAuthTokenDetailsStorageKey, JSON.stringify(tokenResponse));
  }

  /**
   * Following functions are for two factor authentication and require
   * first level authorization headers to be setup for the requests.
   */

  /**
   * Gets the two factor authentication delivery methods available for the user.
   */
  getDeliveryMethods() {
    return this.http.get('/twofactor');
  }

  showDialog() {
    this.dialogShown = true;
  }

  resetDialog() {
    this.dialogShown = false;
  }

  hasDialogBeenShown() {
    return this.dialogShown;
  }

  /**
   * Requests OTP to be sent via the given delivery method.
   * @param {any} deliveryMethod Delivery method for the OTP.
   */
  requestOTP(deliveryMethod: any) {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('deliveryMethod', deliveryMethod.name);
    httpParams = httpParams.set('extendedToken', this.rememberMe.toString());
    return this.http.post(`/twofactor`, {}, { params: httpParams });
  }

  /**
   * Validates the OTP and authenticates the user on success.
   * @param {string} otp
   */
  validateOTP(otp: string) {
    const httpParams = new HttpParams().set('token', otp);
    return this.http.post(`/twofactor/validate`, {}, { params: httpParams }).pipe(
      map((response) => {
        this.onOTPValidateSuccess(response);
      })
    );
  }

  /**
   * Sets the two factor authorization token followed by one of the following:
   *
   * Sends an alert if password has expired and requires a reset.
   *
   * Sends an alert on successful login.
   * @param {any} response Two factor authentication token details.
   */
  private onOTPValidateSuccess(response: any) {
    this.authenticationInterceptor.setTwoFactorAccessToken(response.token);
    if (this.credentials.shouldRenewPassword) {
      this.alertService.alert({
        type: 'Password Expired',
        message: 'Your password has expired, please reset your password!'
      });
    } else {
      this.setCredentials(this.credentials);
      this.alertService.alert({
        type: 'Authentication Success',
        message: `${this.credentials.username} successfully logged in!`
      });
      delete this.credentials;
      this.storage.setItem(this.twoFactorAuthenticationTokenStorageKey, JSON.stringify(response));
    }
  }

  /**
   * Resets the user's password and authenticates the user.
   * @param {any} passwordDetails New password.
   */
  resetPassword(passwordDetails: any) {
    return this.http.put(`/users/${this.credentials.userId}`, passwordDetails).pipe(
      map(() => {
        this.alertService.alert({ type: 'Password Reset Success', message: `Your password was sucessfully reset!` });
        this.authenticationInterceptor.removeAuthorization();
        this.authenticationInterceptor.removeTwoFactorAuthorization();
        const loginContext: LoginContext = {
          username: this.credentials.username,
          password: passwordDetails.password,
          remember: this.rememberMe
        };
        this.login(loginContext).subscribe();
      })
    );
  }

  /**
   * Requests a password-reset email. Unauthenticated; tenant header is set by the interceptor.
   */
  requestPasswordReset(username: string) {
    return this.http.post('/passwordreset/request', { username });
  }

  /**
   * Completes a password reset with a magic-link token. Does not sign the user in.
   */
  completePasswordReset(token: string, password: string, repeatPassword: string) {
    return this.http.post('/passwordreset/complete', { token, password, repeatPassword });
  }

  /**
   * True when the UI is showing another user's session.
   */
  isImpersonating(): boolean {
    return !!this.getImpersonationState();
  }

  /**
   * Username of the user currently being viewed, if impersonating.
   */
  getImpersonatedUsername(): string | null {
    return this.getImpersonationState()?.targetUsername ?? null;
  }

  /**
   * Switch the effective session to the given user. Keeps the admin Basic auth key.
   */
  loginAsUser(userId: number): Observable<boolean> {
    if (this.isImpersonating()) {
      return throwError(() => new Error('Already impersonating another user'));
    }
    const actor = this.getCredentials();
    if (!actor) {
      return throwError(() => new Error('Not authenticated'));
    }
    return this.http.post(`/users/${userId}?command=loginAs`, {}).pipe(
      map((profile: Credentials) => {
        this.storeOriginalCredentials(actor);
        this.storeImpersonationState({
          targetUserId: userId,
          targetUsername: profile.username,
          actorUsername: actor.username
        });
        const switched: Credentials = {
          ...profile,
          authenticated: true,
          base64EncodedAuthenticationKey: actor.base64EncodedAuthenticationKey,
          accessToken: actor.accessToken,
          rememberMe: actor.rememberMe
        };
        this.setCredentials(switched);
        this.authenticationInterceptor.setImpersonateUser(userId);
        this.clearSessionBoundState();
        this.reloadHome();
        return true;
      })
    );
  }

  /**
   * Restore the original admin session.
   */
  stopImpersonating(): Observable<boolean> {
    const impersonation = this.getImpersonationState();
    const original = this.getOriginalCredentials();
    this.authenticationInterceptor.removeImpersonateUser();
    if (impersonation?.targetUserId) {
      this.http.post(`/users/${impersonation.targetUserId}?command=stopLoginAs`, {}).subscribe();
    }
    this.clearImpersonationState();
    this.clearSessionBoundState();
    if (original) {
      this.rememberMe = !!original.rememberMe;
      this.setCredentials(original);
      if (environment.oauth.enabled && original.accessToken) {
        this.authenticationInterceptor.setAuthorizationToken(original.accessToken);
      } else if (original.base64EncodedAuthenticationKey) {
        this.authenticationInterceptor.setAuthorizationToken(original.base64EncodedAuthenticationKey);
      }
    }
    this.reloadHome();
    return of(true);
  }

  private storeOriginalCredentials(credentials: Credentials): void {
    const payload = JSON.stringify(credentials);
    sessionStorage.setItem(this.originalCredentialsStorageKey, payload);
    if (this.rememberMe) {
      localStorage.setItem(this.originalCredentialsStorageKey, payload);
    }
  }

  private getOriginalCredentials(): Credentials | null {
    const raw =
      sessionStorage.getItem(this.originalCredentialsStorageKey) ||
      localStorage.getItem(this.originalCredentialsStorageKey);
    return raw ? JSON.parse(raw) : null;
  }

  private storeImpersonationState(state: {
    targetUserId: number;
    targetUsername: string;
    actorUsername: string;
  }): void {
    const payload = JSON.stringify(state);
    sessionStorage.setItem(this.impersonationStorageKey, payload);
    if (this.rememberMe) {
      localStorage.setItem(this.impersonationStorageKey, payload);
    }
  }

  private getImpersonationState(): { targetUserId: number; targetUsername: string; actorUsername: string } | null {
    const raw =
      sessionStorage.getItem(this.impersonationStorageKey) || localStorage.getItem(this.impersonationStorageKey);
    return raw ? JSON.parse(raw) : null;
  }

  private clearImpersonationState(): void {
    sessionStorage.removeItem(this.originalCredentialsStorageKey);
    localStorage.removeItem(this.originalCredentialsStorageKey);
    sessionStorage.removeItem(this.impersonationStorageKey);
    localStorage.removeItem(this.impersonationStorageKey);
    this.authenticationInterceptor.removeImpersonateUser();
  }

  private clearSessionBoundState(): void {
    [
      'mifosXLocation',
      'disbursementData',
      'Success'
    ].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  private reloadHome(): void {
    window.location.replace(`${window.location.pathname}${window.location.search}#/home`);
    window.location.reload();
  }

  /*
   * Get user logged in
   */
  getUserLoggedIn(): boolean {
    return this.userLoggedIn;
  }
}
