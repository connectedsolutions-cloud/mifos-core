export interface ComponentReference {
  id: string;
  name: string;
  group: ComponentGroup;
  selector: string;
  source: string;
  inputs: string;
  preview: boolean;
  note?: string;
}

export type ComponentGroup = 'forms' | 'identity' | 'display' | 'chrome' | 'dialogs' | 'data';

export const COMPONENT_REFERENCES: ComponentReference[] = [
  {
    id: 'stepper-buttons',
    name: 'Stepper buttons',
    group: 'forms',
    selector: 'mifosx-stepper-buttons',
    source: 'shared/steppers/stepper-buttons',
    inputs: 'disablePrevious, disableNext',
    preview: true,
    note: 'Previous and Next for a mat-step. Place it inside the step.'
  },
  {
    id: 'input-amount',
    name: 'Amount input',
    group: 'forms',
    selector: 'mifosx-input-amount',
    source: 'shared/input-amount',
    inputs: 'inputLabel, currency, inputFormControl, isRequired, minVal, maxVal',
    preview: true
  },
  {
    id: 'input-password',
    name: 'Password input',
    group: 'forms',
    selector: 'mifosx-input-password',
    source: 'shared/input-password',
    inputs: 'label, required, customErrorMessage, customErrorName',
    preview: true
  },
  {
    id: 'file-upload',
    name: 'File upload',
    group: 'forms',
    selector: 'mifosx-file-upload',
    source: 'shared/file-upload',
    inputs: 'flex, acceptFilter',
    preview: true
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    group: 'forms',
    selector: 'mifosx-dropdown',
    source: 'shared/dropdown',
    inputs: 'labelText, placeHolderText, selectOptions, controlSelect, required',
    preview: true,
    note: 'Parent form must expose a control named controlSelect.'
  },
  {
    id: 'gl-account-selector',
    name: 'GL account selector',
    group: 'forms',
    selector: 'mifosx-gl-account-selector',
    source: 'shared/accounting/gl-account-selector',
    inputs: 'inputLabel, inputFormControl, glAccountList, required',
    preview: true
  },
  {
    id: 'formfield',
    name: 'Form field',
    group: 'forms',
    selector: 'mifosx-formfield',
    source: 'shared/form-dialog/formfield',
    inputs: 'form, formfield',
    preview: false,
    note: 'Renders a FormfieldBase inside a form dialog.'
  },
  {
    id: 'account-number',
    name: 'Account number',
    group: 'identity',
    selector: 'mifosx-account-number',
    source: 'shared/account-number',
    inputs: 'accountNo, display, clientId, accountId, accountType',
    preview: true
  },
  {
    id: 'entity-name',
    name: 'Entity name',
    group: 'identity',
    selector: 'mifosx-entity-name',
    source: 'shared/entity-name',
    inputs: 'entityName, display',
    preview: true
  },
  {
    id: 'external-identifier',
    name: 'External identifier',
    group: 'identity',
    selector: 'mifosx-external-identifier',
    source: 'shared/external-identifier',
    inputs: 'externalId, completed, display',
    preview: true
  },
  {
    id: 'long-text',
    name: 'Long text',
    group: 'identity',
    selector: 'mifosx-long-text',
    source: 'shared/long-text',
    inputs: 'textValue, chars',
    preview: true
  },
  {
    id: 'account-status-mark',
    name: 'Account status mark',
    group: 'identity',
    selector: 'mifosx-account-status-mark',
    source: 'shared/account-status-progress',
    inputs: 'accountKind, statusCode, statusLabel, colorCode, appearance, stepDates',
    preview: true
  },
  {
    id: 'gl-account-display',
    name: 'GL account display',
    group: 'display',
    selector: 'mifosx-gl-account-display',
    source: 'shared/accounting/gl-account-display',
    inputs: 'glAccount, accountTitle, withTitle, withAccount',
    preview: true
  },
  {
    id: 'loader',
    name: 'Loader',
    group: 'display',
    selector: 'mifosx-loader',
    source: 'shared/loader',
    inputs: 'diameter',
    preview: true
  },
  {
    id: 'svg-icon',
    name: 'SVG icon',
    group: 'display',
    selector: 'mifosx-svg-icon',
    source: 'shared/svg-icon',
    inputs: 'iconFile, iconName, iconClass, iconWidth',
    preview: true
  },
  {
    id: 'theme-toggle',
    name: 'Theme toggle',
    group: 'chrome',
    selector: 'mifosx-theme-toggle',
    source: 'shared/theme-toggle',
    inputs: 'menuItem',
    preview: true,
    note: 'Clicking it changes the app theme.'
  },
  {
    id: 'language-selector',
    name: 'Language selector',
    group: 'chrome',
    selector: 'mifosx-language-selector',
    source: 'shared/language-selector',
    inputs: 'menuItem',
    preview: false,
    note: 'Toolbar and profile-menu language control.'
  },
  {
    id: 'tenant-selector',
    name: 'Tenant selector',
    group: 'chrome',
    selector: 'mifosx-tenant-selector',
    source: 'shared/tenant-selector',
    inputs: '',
    preview: false,
    note: 'Shell control. It reads the signed-in tenant list.'
  },
  {
    id: 'server-selector',
    name: 'Server selector',
    group: 'chrome',
    selector: 'mifosx-server-selector',
    source: 'shared/server-selector',
    inputs: '',
    preview: false,
    note: 'Shell control for the API server.'
  },
  {
    id: 'search-tool',
    name: 'Search tool',
    group: 'chrome',
    selector: 'mifosx-search-tool',
    source: 'shared/search-tool',
    inputs: '',
    preview: false,
    note: 'Shell search. It queries the API.'
  },
  {
    id: 'notifications-tray',
    name: 'Notifications tray',
    group: 'chrome',
    selector: 'mifosx-notifications-tray',
    source: 'shared/notifications-tray',
    inputs: '',
    preview: false,
    note: 'Shell tray. It loads the current user notifications.'
  },
  {
    id: 'footer',
    name: 'Footer',
    group: 'chrome',
    selector: 'mifosx-footer',
    source: 'shared/footer',
    inputs: 'styleClass',
    preview: false,
    note: 'App footer. It loads the Fineract version.'
  },
  {
    id: 'confirmation-dialog',
    name: 'Confirmation dialog',
    group: 'dialogs',
    selector: 'mifosx-confirmation-dialog',
    source: 'shared/confirmation-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'delete-dialog',
    name: 'Delete dialog',
    group: 'dialogs',
    selector: 'mifosx-delete-dialog',
    source: 'shared/delete-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'cancel-dialog',
    name: 'Cancel dialog',
    group: 'dialogs',
    selector: 'mifosx-cancel-dialog',
    source: 'shared/cancel-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'error-dialog',
    name: 'Error dialog',
    group: 'dialogs',
    selector: 'mifosx-error-dialog',
    source: 'shared/error-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'enable-dialog',
    name: 'Enable dialog',
    group: 'dialogs',
    selector: 'mifosx-enable-dialog',
    source: 'shared/enable-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'disable-dialog',
    name: 'Disable dialog',
    group: 'dialogs',
    selector: 'mifosx-disable-dialog',
    source: 'shared/disable-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'form-dialog',
    name: 'Form dialog',
    group: 'dialogs',
    selector: 'mifosx-form-dialog',
    source: 'shared/form-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog. Fields come from FormfieldBase.'
  },
  {
    id: 'change-password-dialog',
    name: 'Change password dialog',
    group: 'dialogs',
    selector: 'mifosx-change-password-dialog',
    source: 'shared/change-password-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'keyboard-shortcuts-dialog',
    name: 'Keyboard shortcuts dialog',
    group: 'dialogs',
    selector: 'mifosx-keyboard-shortcuts-dialog',
    source: 'shared/keyboard-shortcuts-dialog',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened with MatDialog.'
  },
  {
    id: 'account-status-progress-dialog',
    name: 'Account status progress dialog',
    group: 'dialogs',
    selector: 'mifosx-account-status-progress-dialog',
    source: 'shared/account-status-progress',
    inputs: 'MAT_DIALOG_DATA',
    preview: false,
    note: 'Opened from the account status mark.'
  },
  {
    id: 'entity-notes-tab',
    name: 'Notes tab',
    group: 'data',
    selector: 'mifosx-entity-notes-tab',
    source: 'shared/tabs/entity-notes-tab',
    inputs: 'entityId, entityNotes, callbackAdd, callbackEdit, callbackDelete',
    preview: false,
    note: 'Entity view tab.'
  },
  {
    id: 'entity-documents-tab',
    name: 'Documents tab',
    group: 'data',
    selector: 'mifosx-entity-documents-tab',
    source: 'shared/tabs/entity-documents-tab',
    inputs: 'entityId, entityType, entityDocuments, callbackUpload, callbackDelete',
    preview: false,
    note: 'Entity view tab.'
  },
  {
    id: 'entity-datatable-tab',
    name: 'Datatable tab',
    group: 'data',
    selector: 'mifosx-entity-datatable-tab',
    source: 'shared/tabs/entity-datatable-tab',
    inputs: 'entityDatatable, entityType, entityId, multiRowDatatableFlag, twoColumnTable',
    preview: false,
    note: 'Entity view tab.'
  },
  {
    id: 'datatable-single-row',
    name: 'Datatable single row',
    group: 'data',
    selector: 'mifosx-datatable-single-row',
    source: 'shared/tabs/entity-datatable-tab/datatable-single-row',
    inputs: 'dataObject, entityId, entityType, twoColumnTable',
    preview: false,
    note: 'Used by the datatable tab.'
  },
  {
    id: 'datatable-multi-row',
    name: 'Datatable multi row',
    group: 'data',
    selector: 'mifosx-datatable-multi-row',
    source: 'shared/tabs/entity-datatable-tab/datatable-multi-row',
    inputs: 'dataObject, entityId, entityType',
    preview: false,
    note: 'Used by the datatable tab.'
  },
  {
    id: 'transaction-payment-detail',
    name: 'Transaction payment detail',
    group: 'data',
    selector: 'mifosx-transaction-payment-detail',
    source: 'shared/transaction-payment-detail',
    inputs: 'paymentDetailData',
    preview: false,
    note: 'Shown on a transaction.'
  },
  {
    id: 'view-journal-entry',
    name: 'Journal entry',
    group: 'data',
    selector: 'mifosx-view-journal-entry',
    source: 'shared/accounting/view-journal-entry',
    inputs: '',
    preview: false,
    note: 'Accounting detail view.'
  },
  {
    id: 'view-journal-entry-transaction',
    name: 'Journal entry transaction',
    group: 'data',
    selector: 'mifosx-view-journal-entry-transaction',
    source: 'shared/accounting/view-journal-entry-transaction',
    inputs: '',
    preview: false,
    note: 'Accounting detail view.'
  },
  {
    id: 'view-savings-accounting-details',
    name: 'Savings accounting details',
    group: 'data',
    selector: 'mifosx-view-savings-accounting-details',
    source: 'shared/accounting/view-savings-accounting-details',
    inputs: 'accountingRule, accountingMappings',
    preview: false,
    note: 'Product accounting summary.'
  }
];

const componentIds = COMPONENT_REFERENCES.map((component) => component.id);
const duplicateComponentIds = componentIds.filter((id, index) => componentIds.indexOf(id) !== index);

if (duplicateComponentIds.length > 0) {
  throw new Error(`Duplicate component ids: ${duplicateComponentIds.join(', ')}`);
}

export const COMPONENT_GROUPS: ComponentGroup[] = [
  'forms',
  'identity',
  'display',
  'chrome',
  'dialogs',
  'data'
];

export function componentReferenceById(id: string): ComponentReference | undefined {
  return COMPONENT_REFERENCES.find((component) => component.id === id);
}

export function formatComponentReference(component: ComponentReference): string {
  return [
    `component: ${component.id}`,
    `route: #/components/${component.id}`,
    `name: ${component.name}`,
    `group: ${component.group}`,
    `selector: ${component.selector}`,
    `source: ${component.source}`,
    component.inputs ? `inputs: ${component.inputs}` : '',
    component.note ? `note: ${component.note}` : ''
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}
