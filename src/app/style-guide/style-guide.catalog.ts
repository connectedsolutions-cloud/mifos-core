export interface StyleReference {
  id: string;
  name: string;
  group: 'color' | 'type' | 'spacing' | 'surface' | 'control' | 'pattern';
  source: string;
  token: string;
  value: string;
  kind: 'theme' | 'fixed' | 'control' | 'pattern';
  note?: string;
  set?: string;
  cssVar?: string;
  sample?: string;
  size?: string;
  weight?: string;
  lineHeight?: string;
}

export const STYLE_REFERENCES: StyleReference[] = [
  {
    id: 'color-primary',
    name: 'Primary',
    group: 'color',
    set: 'Material theme',
    source: 'theme/_material-palette.scss',
    token: '$primary-palette 500',
    value: '#1074b9',
    kind: 'theme'
  },
  {
    id: 'color-accent',
    name: 'Accent',
    group: 'color',
    set: 'Material theme',
    source: 'theme/_material-palette.scss',
    token: '$accent-palette 500',
    value: '#b4d575',
    kind: 'theme'
  },
  {
    id: 'color-warn',
    name: 'Warn',
    group: 'color',
    set: 'Material theme',
    source: 'theme/_material-palette.scss',
    token: 'mat.$m2-red-palette',
    value: '#f44336',
    kind: 'theme'
  },
  {
    id: 'color-app-background',
    name: 'App background',
    group: 'color',
    set: 'Material theme',
    source: 'theme/mifosx-theme.scss',
    token: '--mat-app-background-color',
    value: '#fafafa',
    kind: 'theme',
    cssVar: '--mat-app-background-color',
    note: 'Dark theme uses #303030.'
  },
  {
    id: 'color-base',
    name: 'Base',
    group: 'color',
    set: 'Base, highlight, accent',
    source: 'assets/styles/_colours.scss',
    token: '$base',
    value: '#353b3b',
    kind: 'fixed'
  },
  {
    id: 'color-highlight',
    name: 'Highlight',
    group: 'color',
    set: 'Base, highlight, accent',
    source: 'assets/styles/_colours.scss',
    token: '$highlight',
    value: '#2980b9',
    kind: 'fixed'
  },
  {
    id: 'color-flat-accent',
    name: 'Flat accent',
    group: 'color',
    set: 'Base, highlight, accent',
    source: 'assets/styles/_colours.scss',
    token: '$accent',
    value: '#3498db',
    kind: 'fixed',
    note: 'Sass $accent. Material accent is color-accent.'
  },
  {
    id: 'color-header-surface',
    name: 'Header surface',
    group: 'color',
    set: 'Base, highlight, accent',
    source: 'assets/styles/_colours.scss',
    token: '--mifosx-header-surface',
    value: '#e4eef6',
    kind: 'fixed'
  },
  {
    id: 'color-white',
    name: 'White',
    group: 'color',
    set: 'Greys',
    source: 'assets/styles/_colours.scss',
    token: '$white',
    value: '#ffffff',
    kind: 'fixed'
  },
  {
    id: 'color-light-grey',
    name: 'Light grey',
    group: 'color',
    set: 'Greys',
    source: 'assets/styles/_colours.scss',
    token: '$light-grey',
    value: '#f5f5f5',
    kind: 'fixed'
  },
  {
    id: 'color-mid-grey',
    name: 'Mid grey',
    group: 'color',
    set: 'Greys',
    source: 'assets/styles/_colours.scss',
    token: '$mid-grey',
    value: '#d7dada',
    kind: 'fixed'
  },
  {
    id: 'color-dark-grey',
    name: 'Dark grey',
    group: 'color',
    set: 'Greys',
    source: 'assets/styles/_colours.scss',
    token: '$dark-grey',
    value: '#353b3b',
    kind: 'fixed'
  },
  {
    id: 'color-black',
    name: 'Black',
    group: 'color',
    set: 'Greys',
    source: 'assets/styles/_colours.scss',
    token: '$black',
    value: '#000000',
    kind: 'fixed'
  },
  {
    id: 'color-message-default',
    name: 'Message default',
    group: 'color',
    set: 'Messages',
    source: 'assets/styles/_colours.scss',
    token: '$msg-default',
    value: '#999999',
    kind: 'fixed'
  },
  {
    id: 'color-message-success',
    name: 'Message success',
    group: 'color',
    set: 'Messages',
    source: 'assets/styles/_colours.scss',
    token: '$msg-success',
    value: '#5cb85c',
    kind: 'fixed'
  },
  {
    id: 'color-message-warning',
    name: 'Message warning',
    group: 'color',
    set: 'Messages',
    source: 'assets/styles/_colours.scss',
    token: '$msg-warning',
    value: '#f0ad4e',
    kind: 'fixed'
  },
  {
    id: 'color-message-danger',
    name: 'Message danger',
    group: 'color',
    set: 'Messages',
    source: 'assets/styles/_colours.scss',
    token: '$msg-danger',
    value: '#d9534f',
    kind: 'fixed'
  },
  {
    id: 'color-message-info',
    name: 'Message info',
    group: 'color',
    set: 'Messages',
    source: 'assets/styles/_colours.scss',
    token: '$msg-info',
    value: '#5bc0de',
    kind: 'fixed'
  },
  {
    id: 'color-status-active',
    name: 'Status active',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-active',
    value: '#5cb85c',
    kind: 'fixed'
  },
  {
    id: 'color-status-inactive',
    name: 'Status inactive',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-inactive',
    value: '#666f73',
    kind: 'fixed'
  },
  {
    id: 'color-status-pending',
    name: 'Status pending',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-pending',
    value: '#ffa500',
    kind: 'fixed'
  },
  {
    id: 'color-status-approved',
    name: 'Status approved',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-approved',
    value: '#4461e2',
    kind: 'fixed'
  },
  {
    id: 'color-status-chargeoff',
    name: 'Status charge off',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-chargeoff',
    value: '#f39c12',
    kind: 'fixed'
  },
  {
    id: 'color-status-overpaid',
    name: 'Status overpaid',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-overpaid',
    value: '#800080',
    kind: 'fixed'
  },
  {
    id: 'color-status-overdue',
    name: 'Status overdue',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-active-overdue',
    value: '#ff0000',
    kind: 'fixed'
  },
  {
    id: 'color-status-matured',
    name: 'Status matured',
    group: 'color',
    set: 'Status',
    source: 'assets/styles/_colours.scss',
    token: '$status-matured',
    value: '#ff4000',
    kind: 'fixed'
  },
  {
    id: 'type-page-title',
    name: 'Page title',
    group: 'type',
    set: 'scale',
    source: 'assets/styles/_text.scss',
    token: '.mat-h1',
    value: '24px / 400 / 32px',
    kind: 'fixed',
    sample: 'Clientes',
    size: '24px',
    weight: '400',
    lineHeight: '32px'
  },
  {
    id: 'type-header-title',
    name: 'Header title',
    group: 'type',
    set: 'scale',
    source: 'assets/styles/_account-header.scss',
    token: '.account-header-title',
    value: '20px / 500 / 24px',
    kind: 'fixed',
    sample: 'robert cliente 3 ayalaa',
    size: '20px',
    weight: '500',
    lineHeight: '24px'
  },
  {
    id: 'type-body',
    name: 'Body',
    group: 'type',
    set: 'scale',
    source: 'assets/styles/_text.scss',
    token: 'body',
    value: '14px / 400 / 1.5',
    kind: 'fixed',
    sample: 'Texto de formulario y tablas',
    size: '14px',
    weight: '400',
    lineHeight: '1.5'
  },
  {
    id: 'type-fact-value',
    name: 'Fact value',
    group: 'type',
    set: 'scale',
    source: 'clients-view.component.scss',
    token: '.client-fact-value',
    value: '14px / 500 / 20px',
    kind: 'fixed',
    sample: 'Agencia Santiago de María',
    size: '14px',
    weight: '500',
    lineHeight: '20px'
  },
  {
    id: 'type-status',
    name: 'Status text',
    group: 'type',
    set: 'scale',
    source: 'clients-view.component.scss',
    token: '.client-status',
    value: '13px / 400 / 16px',
    kind: 'fixed',
    sample: 'Activo',
    size: '13px',
    weight: '400',
    lineHeight: '16px'
  },
  {
    id: 'type-fact-label',
    name: 'Fact label',
    group: 'type',
    set: 'scale',
    source: 'clients-view.component.scss',
    token: '.client-fact-label',
    value: '12px / 400 / 16px',
    kind: 'fixed',
    sample: 'Fecha de activación',
    size: '12px',
    weight: '400',
    lineHeight: '16px'
  },
  {
    id: 'type-utilities',
    name: 'Text utilities',
    group: 'type',
    source: 'assets/styles/_text.scss',
    token: '.bold .uppercase .text-right',
    value: '',
    kind: 'fixed'
  },
  {
    id: 'spacing-scale',
    name: 'Spacing scale',
    group: 'spacing',
    source: 'assets/styles/_padding.scss',
    token: '.p-20 .m-t-10 .gap-20px',
    value: '5, 10, 15, 20, 24, 32',
    kind: 'fixed',
    note: 'Utilities follow .p-20, .p-t-10, .m-b-15.'
  },
  {
    id: 'spacing-padding-gap',
    name: 'Padding versus gap',
    group: 'spacing',
    source: 'main.scss',
    token: '.layout-row .gap-20px .p-20',
    value: '',
    kind: 'fixed'
  },
  {
    id: 'surface-set',
    name: 'Surfaces',
    group: 'surface',
    source: 'theme/mifosx-theme.scss',
    token: '--mat-app-background-color --mifosx-header-surface',
    value: '',
    kind: 'theme',
    note: 'App background follows the theme. Header surface stays #e4eef6.'
  },
  {
    id: 'control-theme-buttons',
    name: 'Theme controls',
    group: 'control',
    source: 'theme/mifosx-theme.scss',
    token: 'mat-raised-button color',
    value: 'primary #1074b9 · accent #b4d575 · warn #f44336',
    kind: 'theme',
    note: 'These buttons follow the theme toggle.'
  },
  {
    id: 'control-button-variants',
    name: 'Button variants',
    group: 'control',
    source: '@angular/material/button',
    token: 'mat-raised-button mat-stroked-button mat-button mat-icon-button',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-button-image',
    name: 'Client image buttons',
    group: 'control',
    source: 'clients-view.component.scss',
    token: '.client-image-button',
    value: '26px',
    kind: 'control'
  },
  {
    id: 'control-button-focus',
    name: 'Focus ring',
    group: 'control',
    source: '@angular/material/button',
    token: ':focus-visible',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-fill',
    name: 'Fill field',
    group: 'control',
    source: 'MAT_FORM_FIELD_DEFAULT_OPTIONS',
    token: 'appearance=fill',
    value: 'default',
    kind: 'control'
  },
  {
    id: 'control-field-outline',
    name: 'Outline field',
    group: 'control',
    source: '@angular/material/form-field',
    token: 'appearance=outline',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-textarea',
    name: 'Textarea',
    group: 'control',
    source: '@angular/material/input',
    token: 'textarea',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-date',
    name: 'Date',
    group: 'control',
    source: '@angular/material/datepicker',
    token: 'matDatepicker',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-amount',
    name: 'Amount',
    group: 'control',
    source: 'shared/input-amount',
    token: 'mifosx-input-amount',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-password',
    name: 'Password',
    group: 'control',
    source: 'shared/input-password',
    token: 'mifosx-input-password',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-select',
    name: 'Select',
    group: 'control',
    source: '@angular/material/select',
    token: 'mat-select',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-disabled',
    name: 'Disabled field',
    group: 'control',
    source: '@angular/material/form-field',
    token: 'disabled',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-error',
    name: 'Error field',
    group: 'control',
    source: '@angular/material/form-field',
    token: 'mat-error',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-field-choice',
    name: 'Checkbox, radio, toggle',
    group: 'control',
    source: '@angular/material',
    token: 'mat-checkbox mat-radio-group mat-slide-toggle',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-icon-action',
    name: 'Action icons',
    group: 'control',
    source: '@fortawesome/fontawesome-free',
    token: 'fa fa-upload · fa fa-camera · fa fa-trash',
    value: '',
    kind: 'control',
    note: 'CSS webfont'
  },
  {
    id: 'control-icon-button',
    name: 'Icon button',
    group: 'control',
    source: '@fortawesome/angular-fontawesome',
    token: 'mat-icon + fa-icon',
    value: 'bars',
    kind: 'control'
  },
  {
    id: 'control-tabs',
    name: 'Entity tabs',
    group: 'control',
    source: '@angular/material/tabs',
    token: 'mat-tab-group',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-table-list',
    name: 'List',
    group: 'control',
    source: 'shared/styles/list-layout.scss',
    token: '.container .search-box .action-button .bordered-table',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-table-empty',
    name: 'Empty table',
    group: 'control',
    source: 'shared/styles/list-layout.scss',
    token: '.bordered-table',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-status-color',
    name: 'Status color',
    group: 'control',
    source: 'assets/styles/_status.scss',
    token: '.status-active',
    value: '',
    kind: 'fixed'
  },
  {
    id: 'control-status-ribbon',
    name: 'Status ribbon',
    group: 'control',
    source: 'assets/styles/_status.scss',
    token: '.account-status-ribbon',
    value: '',
    kind: 'fixed'
  },
  {
    id: 'control-status-mark',
    name: 'Status mark',
    group: 'control',
    source: 'shared/account-status-progress',
    token: 'mifosx-account-status-mark',
    value: '',
    kind: 'control'
  },
  {
    id: 'control-warning',
    name: 'Warning',
    group: 'control',
    source: 'assets/styles/_ui-warning.scss',
    token: '.ui-warning',
    value: '',
    kind: 'fixed'
  },
  {
    id: 'control-feedback',
    name: 'Tooltip, chip, menu, snackbar',
    group: 'control',
    source: '@angular/material',
    token: 'matTooltip mat-chip mat-menu MatSnackBar',
    value: '',
    kind: 'control'
  },
  {
    id: 'pattern-section-header',
    name: 'Section header',
    group: 'pattern',
    source: 'mat-card-title',
    token: 'mat-card-title',
    value: '',
    kind: 'pattern'
  },
  {
    id: 'pattern-dialog-header',
    name: 'Dialog header',
    group: 'pattern',
    source: '@angular/material/dialog',
    token: 'h2 mat-dialog-title',
    value: '',
    kind: 'pattern',
    note: 'No shared header class.'
  },
  {
    id: 'pattern-account-header',
    name: 'Account header',
    group: 'pattern',
    source: 'assets/styles/_account-header.scss',
    token: '.account-header .account-header-fact',
    value: '',
    kind: 'pattern'
  },
  {
    id: 'pattern-client-header',
    name: 'Client header',
    group: 'pattern',
    source: 'clients-view.component.scss',
    token: '.account-card .header .client-fact',
    value: '',
    kind: 'pattern',
    note: 'Filled facts. Empty facts use weight 400 and #5f6368.'
  },
  {
    id: 'pattern-client-header-empty',
    name: 'Client header empty',
    group: 'pattern',
    source: 'clients-view.component.scss',
    token: '.client-fact.is-empty',
    value: '400 / #5f6368',
    kind: 'pattern'
  }
];

const styleIds = STYLE_REFERENCES.map((style) => style.id);
const duplicateStyleIds = styleIds.filter((id, index) => styleIds.indexOf(id) !== index);

if (duplicateStyleIds.length > 0) {
  throw new Error(`Duplicate style ids: ${duplicateStyleIds.join(', ')}`);
}

export const STYLE_GROUPS = [
  'color',
  'type',
  'spacing',
  'surface',
  'control',
  'pattern'
] as const;

export function styleReferenceById(id: string): StyleReference | undefined {
  return STYLE_REFERENCES.find((style) => style.id === id);
}

export function formatStyleReference(style: StyleReference): string {
  return [
    `style: ${style.id}`,
    `route: #/style-guide/${style.id}`,
    `name: ${style.name}`,
    `group: ${style.group}`,
    `source: ${style.source}`,
    `token: ${style.token}`,
    style.value ? `value: ${style.value}` : '',
    `kind: ${style.kind}`,
    style.note ? `note: ${style.note}` : ''
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}
