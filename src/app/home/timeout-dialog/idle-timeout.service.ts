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
    this.$onSessionTimeout = this.timeout$.asObservable();

    this.resetTimer$.subscribe(() => {
      this.timerSubscription?.unsubscribe();

      // Track when timer starts
      this.timerStartTime = Date.now();
      this.lastResetTime = this.timerStartTime;
      this.resetCount++;

      this.timerSubscription = timer(this.timeoutDelay).subscribe(() => {
        this.timeout$.next();
        this.stop();
      });
    });
  }

  start() {
    if (!this.active) {
      this.active = true;
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
    }
  }

  stop() {
    if (this.active) {
      this.active = false;
      this.timerSubscription?.unsubscribe();
      this.userActionsSubscription?.unsubscribe();

      // Reset tracking
      this.timerStartTime = undefined;
      this.lastResetTime = undefined;
      this.resetCount = 0;
    }
  }

  reset() {
    if (this.active) {
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
