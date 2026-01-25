import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { fromEvent, merge, Subject, timer, Observable, Subscription } from 'rxjs';
import { switchMap, takeUntil, tap, map } from 'rxjs/operators';

/**
 *  Idle timeout service used to track idle user
 */
@Injectable({
  providedIn: 'root'
})
export class IdleTimeoutService {
  // max timeout for an idle user
  // Use nullish coalescing to allow 0 as a valid value (0 disables timeout)
  // Only use fallback if the value is actually undefined/null
  private readonly timeoutDelay = (() => {
    const envTimeout = environment.session.timeout.idleTimeout;
    // If it's explicitly set (even to 0), use it. Otherwise use fallback.
    const timeout = envTimeout !== undefined && envTimeout !== null ? envTimeout : 300000;

    console.log('[IdleTimeoutService] Timeout delay calculation:', {
      environmentValue: envTimeout,
      environmentValueType: typeof envTimeout,
      calculatedTimeout: timeout,
      calculatedTimeoutMinutes: timeout / 60000,
      usingFallback: envTimeout === undefined || envTimeout === null
    });

    return timeout;
  })();
  private timeout$ = new Subject<void>();
  private resetTimer$ = new Subject<void>();
  private active = false;
  private timerSubscription?: Subscription;
  private userActionsSubscription?: Subscription;
  private timerStartTime?: number;
  private lastResetTime?: number;
  private resetCount = 0;

  // observable timeout
  readonly $onSessionTimeout: Observable<void>;

  constructor() {
    // Log the configured timeout value with detailed diagnostics
    const timeoutMinutes = this.timeoutDelay / 60000;
    const timeoutSeconds = this.timeoutDelay / 1000;
    const envTimeout = environment.session.timeout.idleTimeout;

    console.log('[IdleTimeoutService] Initialized with timeout:', {
      milliseconds: this.timeoutDelay,
      seconds: timeoutSeconds,
      minutes: timeoutMinutes,
      fromEnvironment: envTimeout,
      fromEnvironmentType: typeof envTimeout,
      environmentObject: environment.session,
      windowEnvRaw: window.env?.sessionIdleTimeout,
      windowEnvType: typeof window.env?.sessionIdleTimeout,
      fallbackUsed: envTimeout === undefined || envTimeout === null,
      isZero: envTimeout === 0,
      isFalsy: !envTimeout
    });

    this.$onSessionTimeout = this.timeout$.asObservable();

    this.resetTimer$.subscribe(() => {
      this.timerSubscription?.unsubscribe();

      // Track when timer starts
      this.timerStartTime = Date.now();
      this.lastResetTime = this.timerStartTime;
      this.resetCount++;

      const timeoutMinutes = this.timeoutDelay / 60000;
      console.log(
        `[IdleTimeoutService] Timer started/reset #${this.resetCount} - Timeout set for ${timeoutMinutes.toFixed(2)} minutes (${this.timeoutDelay}ms)`
      );

      this.timerSubscription = timer(this.timeoutDelay).subscribe(() => {
        const elapsedTime = Date.now() - (this.timerStartTime || Date.now());
        const elapsedMinutes = elapsedTime / 60000;
        const elapsedSeconds = elapsedTime / 1000;

        console.warn('[IdleTimeoutService] ⚠️ SESSION TIMEOUT TRIGGERED', {
          configuredTimeout: this.timeoutDelay,
          configuredTimeoutMinutes: timeoutMinutes.toFixed(2),
          actualElapsedTime: elapsedTime,
          actualElapsedMinutes: elapsedMinutes.toFixed(2),
          actualElapsedSeconds: elapsedSeconds.toFixed(2),
          timerStartTime: new Date(this.timerStartTime || 0).toISOString(),
          timeoutTriggeredAt: new Date().toISOString(),
          resetCount: this.resetCount
        });

        this.timeout$.next();
        this.stop();
      });
    });
  }

  start() {
    if (!this.active) {
      this.active = true;
      console.log('[IdleTimeoutService] Service started - monitoring user activity');
      this.reset();

      // Subscribe to user actions only when active
      const events = [
        'mousemove',
        'keydown',
        'wheel',
        'mousedown',
        'scroll'
      ];
      const userActions$ = merge(...events.map((e) => fromEvent(document, e)));
      this.userActionsSubscription = userActions$.subscribe(() => {
        this.reset();
      });
    } else {
      console.log('[IdleTimeoutService] Service already active, ignoring start() call');
    }
  }

  stop() {
    if (this.active) {
      const wasActive = this.active;
      this.active = false;
      this.timerSubscription?.unsubscribe();
      this.userActionsSubscription?.unsubscribe();

      if (this.timerStartTime) {
        const elapsedTime = Date.now() - this.timerStartTime;
        const remainingTime = this.timeoutDelay - elapsedTime;
        const remainingMinutes = remainingTime / 60000;

        console.log('[IdleTimeoutService] Service stopped', {
          elapsedTime: elapsedTime,
          elapsedMinutes: (elapsedTime / 60000).toFixed(2),
          remainingTime: remainingTime > 0 ? remainingTime : 0,
          remainingMinutes: remainingTime > 0 ? remainingMinutes.toFixed(2) : '0.00',
          resetCount: this.resetCount
        });
      } else {
        console.log('[IdleTimeoutService] Service stopped (no timer was running)');
      }

      // Reset tracking
      this.timerStartTime = undefined;
      this.lastResetTime = undefined;
      this.resetCount = 0;
    }
  }

  reset() {
    if (this.active) {
      if (this.timerStartTime) {
        const elapsedTime = Date.now() - this.timerStartTime;
        const remainingTime = this.timeoutDelay - elapsedTime;
        const remainingMinutes = remainingTime / 60000;

        // Only log resets every 30 seconds to avoid spam, or if remaining time is low
        if (remainingTime < 60000 || this.resetCount % 10 === 0) {
          console.log(
            `[IdleTimeoutService] Timer reset - Remaining time: ${remainingMinutes.toFixed(2)} minutes (${remainingTime.toFixed(0)}ms)`
          );
        }
      }
      this.resetTimer$.next();
    }
  }

  /**
   * Get the remaining idle time in milliseconds
   */
  getRemainingTime(): number | null {
    if (!this.active || !this.timerStartTime) {
      return null;
    }
    const elapsedTime = Date.now() - this.timerStartTime;
    const remainingTime = this.timeoutDelay - elapsedTime;
    return remainingTime > 0 ? remainingTime : 0;
  }

  /**
   * Get the configured timeout delay
   */
  getTimeoutDelay(): number {
    return this.timeoutDelay;
  }
}
