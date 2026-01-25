/**
 * Version Check Service
 *
 * This service checks if the application version has changed and clears localStorage
 * when a new version is detected. This prevents issues with cached data from previous
 * versions that may be incompatible with the new build.
 */

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VersionCheckService {
  private readonly VERSION_STORAGE_KEY = 'mifosX_app_version';
  private readonly HASH_STORAGE_KEY = 'mifosX_app_hash';

  /**
   * Check if the application version has changed and clear localStorage if needed
   * @param clearAllStorage If true, clears all localStorage. If false, only clears app-specific keys
   * @returns true if storage was cleared, false otherwise
   */
  checkAndClearStorage(clearAllStorage: boolean = false): boolean {
    const currentVersion = environment.version;
    const currentHash = environment.hash;

    const storedVersion = localStorage.getItem(this.VERSION_STORAGE_KEY);
    const storedHash = localStorage.getItem(this.HASH_STORAGE_KEY);

    // Check if version or hash has changed
    const versionChanged = storedVersion !== currentVersion;
    const hashChanged = storedHash !== currentHash;

    if (versionChanged || hashChanged) {
      console.log('App version changed detected:', {
        oldVersion: storedVersion,
        newVersion: currentVersion,
        oldHash: storedHash,
        newHash: currentHash
      });

      if (clearAllStorage) {
        // Clear all localStorage
        localStorage.clear();
        console.log('Cleared all localStorage due to version change');
      } else {
        // Clear only app-specific keys (preserve other site data if needed)
        this.clearAppStorage();
        console.log('Cleared app-specific localStorage due to version change');
      }

      // Store new version and hash
      localStorage.setItem(this.VERSION_STORAGE_KEY, currentVersion);
      localStorage.setItem(this.HASH_STORAGE_KEY, currentHash);

      return true;
    }

    // No version change, but ensure version is stored (first time load)
    if (!storedVersion) {
      localStorage.setItem(this.VERSION_STORAGE_KEY, currentVersion);
      localStorage.setItem(this.HASH_STORAGE_KEY, currentHash);
    }

    return false;
  }

  /**
   * Clear only app-specific localStorage keys
   * This preserves any data from other applications that might share the domain
   */
  private clearAppStorage(): void {
    // List of all known app-specific localStorage keys
    const appKeys = [
      // Settings
      'mifosXDateFormat',
      'mifosXLanguage',
      'mifosXDecimalsToDisplay',
      'mifosXServerURL',
      'mifosXServers',
      'mifosXTenantIdentifiers',
      'mifosXTenantIdentifier',
      'mifosXServerDate',
      'mifosXServerBusinessDateEnabled',
      'mifosXThemeDarkEnabled',

      // Authentication
      'id_token',
      'access_token',
      'expires_in',
      'refresh_token',

      // Loans
      'disbursementData',

      // Version tracking (will be set again after clearing)
      this.VERSION_STORAGE_KEY,
      this.HASH_STORAGE_KEY
    ];

    // Remove all app-specific keys
    appKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Also clear any keys that start with 'mifosX' as a safety measure
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('mifosX') || key.startsWith('mifos'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Get the current stored version
   */
  getStoredVersion(): string | null {
    return localStorage.getItem(this.VERSION_STORAGE_KEY);
  }

  /**
   * Get the current stored hash
   */
  getStoredHash(): string | null {
    return localStorage.getItem(this.HASH_STORAGE_KEY);
  }

  /**
   * Manually clear all app storage (useful for debugging or manual reset)
   */
  clearAllAppStorage(): void {
    this.clearAppStorage();
    localStorage.removeItem(this.VERSION_STORAGE_KEY);
    localStorage.removeItem(this.HASH_STORAGE_KEY);
  }
}
