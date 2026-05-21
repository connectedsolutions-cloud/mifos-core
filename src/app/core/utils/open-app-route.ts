import { Location } from '@angular/common';
import { Router } from '@angular/router';

/** Keys used by AuthenticationService — must stay in sync. */
const AUTH_STORAGE_KEYS = [
  'mifosXCredentials',
  'mifosXOAuthTokenDetails',
  'mifosXTwoFactorAuthenticationToken'
] as const;

/**
 * sessionStorage is not available in tabs opened via window.open. Copy session auth
 * into localStorage so the new tab can pass AuthenticationGuard (same as "Remember me").
 */
export function mirrorSessionAuthToLocalStorageForNewTab(): void {
  for (const key of AUTH_STORAGE_KEYS) {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue != null) {
      localStorage.setItem(key, sessionValue);
    }
  }
}

/**
 * Builds the hash URL for an in-app route (e.g. `#/dte-preview?loanTransactionId=10`).
 */
export function buildAppRouteExternalUrl(
  router: Router,
  location: Location,
  commands: unknown[],
  queryParams?: Record<string, string | number | boolean | null | undefined>
): string {
  const tree = router.createUrlTree(commands, { queryParams });
  return location.prepareExternalUrl(router.serializeUrl(tree));
}

/**
 * Absolute URL for opening or sharing (e.g. `http://localhost:4200/#/dte-preview?...`).
 * Uses `origin/#/path` — same pattern as other in-app `window.open` calls in this project.
 */
export function buildAppRouteAbsoluteUrl(
  router: Router,
  location: Location,
  commands: unknown[],
  queryParams?: Record<string, string | number | boolean | null | undefined>
): string {
  const external = buildAppRouteExternalUrl(router, location, commands, queryParams);
  const hash = external.startsWith('#') ? external : `#${external}`;
  return `${window.location.origin}/${hash}`;
}

/**
 * Opens an in-app route in a new tab. Required because the app uses hash routing (`useHash: true`).
 * Uses Location.prepareExternalUrl (same mechanism as router links).
 */
export function openAppRouteInNewTab(
  router: Router,
  location: Location,
  commands: unknown[],
  queryParams?: Record<string, string | number | boolean | null | undefined>
): void {
  mirrorSessionAuthToLocalStorageForNewTab();
  const absoluteUrl = buildAppRouteAbsoluteUrl(router, location, commands, queryParams);
  window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
}
