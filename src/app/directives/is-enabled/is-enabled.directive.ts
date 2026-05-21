/** Angular Imports */
import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Custom Services */
import { AuthenticationService } from '../../core/authentication/authentication.service';

/**
 * Is Enabled Directive
 *
 * This directive always displays the template content but prevents actions
 * when users lack the specified permission, showing a warning message.
 */
@Directive({ selector: '[mifosxIsEnabled]', standalone: true })
export class IsEnabledDirective implements AfterViewInit, OnDestroy {
  /** User Permissions */
  private userPermissions: any[];
  /** Permission to check */
  private permission: string = '';
  /** Embedded view reference */
  private viewRef: EmbeddedViewRef<any> | null = null;
  /** Click event listeners */
  private clickListeners: Array<{ element: HTMLElement; listener: (event: Event) => void }> = [];

  /**
   * Extracts User Permissions from User Credentials
   * @param {TemplateRef} templateRef Template Reference
   * @param {ViewContainerRef} viewContainer View Container Reference
   * @param {AuthenticationService} authenticationService AuthenticationService
   * @param {MatSnackBar} snackBar MatSnackBar for showing warnings
   */
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authenticationService: AuthenticationService,
    private snackBar: MatSnackBar
  ) {
    const savedCredentials = this.authenticationService.getCredentials();
    this.userPermissions = savedCredentials?.permissions ?? [];
  }

  /**
   * Sets the permission to check.
   */
  @Input()
  set mifosxIsEnabled(permission: any) {
    if (typeof permission !== 'string') {
      throw new Error('mifosxIsEnabled value must be a string');
    }
    this.permission = permission.trim();
    // Always render the template content
    this.viewContainer.clear();
    this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef);
  }

  /**
   * Sets up click listeners after view is initialized.
   */
  ngAfterViewInit(): void {
    if (this.viewRef) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => this.setupClickListeners(), 0);
    }
  }

  /**
   * Cleans up event listeners on destroy.
   */
  ngOnDestroy(): void {
    this.removeClickListeners();
  }

  /**
   * Sets up click event listeners on all interactive elements in the view.
   */
  private setupClickListeners(): void {
    if (!this.viewRef) {
      return;
    }

    // Remove existing listeners first
    this.removeClickListeners();

    // Get all root nodes from the embedded view
    const rootNodes = this.viewRef.rootNodes;

    // Create a single click handler function
    const clickHandler = (event: Event) => {
      if (!this.hasPermission(this.permission)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this.snackBar.open('user dont has permission', 'OK', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['warning-snackbar']
        });
      }
    };

    // Find all interactive elements (buttons, links, clickable divs, etc.)
    rootNodes.forEach((node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        // Find all clickable elements within this node
        const clickableElements = element.querySelectorAll('button, a, [role="button"]');

        clickableElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          htmlEl.addEventListener('click', clickHandler, true); // Use capture phase
          this.clickListeners.push({ element: htmlEl, listener: clickHandler });
        });

        // Also check if the root element itself is clickable
        if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.getAttribute('role') === 'button') {
          element.addEventListener('click', clickHandler, true);
          this.clickListeners.push({ element, listener: clickHandler });
        }
      }
    });
  }

  /**
   * Removes all click event listeners.
   */
  private removeClickListeners(): void {
    this.clickListeners.forEach(({ element, listener }) => {
      element.removeEventListener('click', listener, true);
    });
    this.clickListeners = [];
  }

  /**
   * Checks if user is permitted.
   * @param {string} permission Permission
   * @returns {true}
   * -`ALL_FUNCTIONS`: user is a Super user.
   * -`ALL_FUNCTIONS_READ`: user has all read permissions and passed permission is 'read' type.
   * - User has special permission to access that feature.
   * @returns {false}
   * - Passed permission doesn't fall under either of above given permission grants.
   * - No value was passed to the is enabled directive.
   */
  private hasPermission(permission: string): boolean {
    if (!permission || permission === '') {
      return false;
    }
    permission = permission.trim();
    if (this.userPermissions.includes('ALL_FUNCTIONS')) {
      return true;
    } else if (permission !== '') {
      if (permission.substring(0, 5) === 'READ_' && this.userPermissions.includes('ALL_FUNCTIONS_READ')) {
        return true;
      } else if (this.userPermissions.includes(permission)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
