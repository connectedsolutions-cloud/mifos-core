/** Angular Imports */
import { HttpContextToken } from '@angular/common/http';

/**
 * When true, ErrorHandlerInterceptor rethrows without showing a global alert.
 * Use for expected failures such as missing optional datatable rows.
 */
export const SKIP_ERROR_HANDLER = new HttpContextToken<boolean>(() => false);
