import { Clipboard } from '@angular/cdk/clipboard';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatOption } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatDialog, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateFormatPipe } from 'app/pipes/date-format.pipe';
import { StatusLookupPipe } from 'app/pipes/status-lookup.pipe';
import { AccountNumberComponent } from 'app/shared/account-number/account-number.component';
import { AccountStatusMarkComponent } from 'app/shared/account-status-progress/account-status-mark.component';
import { EntityNameComponent } from 'app/shared/entity-name/entity-name.component';
import { ExternalIdentifierComponent } from 'app/shared/external-identifier/external-identifier.component';
import { InputAmountComponent } from 'app/shared/input-amount/input-amount.component';
import { InputPasswordComponent } from 'app/shared/input-password/input-password.component';
import { Currency } from 'app/shared/models/general.model';
import { SvgIconComponent } from 'app/shared/svg-icon/svg-icon.component';
import { StyleGuideDialogComponent } from './style-guide-dialog.component';
import { StyleGuideSpecimenComponent } from './style-guide-specimen.component';
import {
  STYLE_GROUPS,
  STYLE_REFERENCES,
  StyleReference,
  formatStyleReference,
  styleReferenceById
} from './style-guide.catalog';

interface ClientSample {
  styleId: string;
  title: string;
  name: string;
  status: string;
  statusCode: string;
  office: string;
  accountNo: string;
  submittedDate: number[] | null;
  activationDate: number[] | null;
  staff: string;
  mobile: string;
  promoter: string;
  executive: string;
}

interface GuideRow {
  name: string;
  office: string;
  status: string;
  statusClass: string;
}

@Component({
  selector: 'mifosx-style-guide',
  templateUrl: './style-guide.component.html',
  styleUrls: ['./style-guide.component.scss'],
  imports: [
    NgClass,
    NgFor,
    NgIf,
    RouterLink,
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCheckbox,
    MatChipSet,
    MatChip,
    MatOption,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatError,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatIcon,
    MatInput,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatPaginatorModule,
    MatRadioButton,
    MatRadioGroup,
    MatSelect,
    MatSlideToggle,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    MatTab,
    MatTabGroup,
    MatTooltip,
    FaIconComponent,
    DateFormatPipe,
    StatusLookupPipe,
    AccountNumberComponent,
    AccountStatusMarkComponent,
    EntityNameComponent,
    ExternalIdentifierComponent,
    InputAmountComponent,
    InputPasswordComponent,
    SvgIconComponent,
    StyleGuideSpecimenComponent
  ]
})
export class StyleGuideComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly styles = STYLE_REFERENCES;
  readonly styleGroups = STYLE_GROUPS;
  readonly colorSetNames = [
    'Material theme',
    'Base, highlight, accent',
    'Greys',
    'Messages',
    'Status'
  ];
  activeStyleId = '';
  unknownStyleId = '';
  copiedId = '';
  indexOpen = false;

  readonly sections = [
    { id: 'index', label: 'Index' },
    { id: 'color', label: 'Color' },
    { id: 'type', label: 'Type' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'surfaces', label: 'Surfaces' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'fields', label: 'Inputs' },
    { id: 'icons', label: 'Icons' },
    { id: 'tabs', label: 'Tabs' },
    { id: 'tables', label: 'Tables' },
    { id: 'feedback', label: 'Status' },
    { id: 'section-header', label: 'Section header' },
    { id: 'dialog-header', label: 'Dialog header' },
    { id: 'account-header', label: 'Account header' },
    { id: 'client-header', label: 'Client header' }
  ];

  readonly spacingSteps = [
    5,
    10,
    15,
    20,
    24,
    32
  ];

  readonly statusSamples = [
    { label: 'Activo', className: 'status-active' },
    { label: 'Inactivo', className: 'status-inactive' },
    { label: 'Pendiente', className: 'status-pending' },
    { label: 'Aprobado', className: 'status-approved' },
    { label: 'Castigado', className: 'status-chargeoff' },
    { label: 'Sobrepagado', className: 'status-overpaid' },
    { label: 'Vencido', className: 'status-active-overdue' },
    { label: 'Madurado', className: 'status-matured' }
  ];

  readonly currency: Currency = {
    code: 'USD',
    name: 'US Dollar',
    displaySymbol: '$'
  };

  readonly clientSamples: ClientSample[] = [
    {
      styleId: 'pattern-client-header',
      title: 'Filled, with empty facts',
      name: 'robert cliente 3 ayalaa',
      status: 'Activo',
      statusCode: 'clientStatusType.active',
      office: 'Agencia Santiago de María',
      accountNo: '000000004',
      submittedDate: [
        2026,
        1,
        4
      ],
      activationDate: [
        2026,
        1,
        28
      ],
      staff: 'ayala, robert empleado 3',
      mobile: '',
      promoter: '',
      executive: 'Ejecutivo asignado'
    },
    {
      styleId: 'pattern-client-header-empty',
      title: 'Empty facts',
      name: 'Cliente sin datos',
      status: 'Pendiente',
      statusCode: 'clientStatusType.pending',
      office: '',
      accountNo: '',
      submittedDate: null,
      activationDate: null,
      staff: '',
      mobile: '',
      promoter: '',
      executive: ''
    }
  ];

  readonly displayedColumns = [
    'name',
    'office',
    'status'
  ];

  readonly amountControl = new UntypedFormControl('1250');

  readonly form = new FormGroup({
    fill: new FormControl('Ver firma'),
    outline: new FormControl('Agencia Santiago de María'),
    notes: new FormControl('Cliente activo desde enero.'),
    date: new FormControl(new Date(2026, 0, 28)),
    password: new FormControl('secreto'),
    office: new FormControl('santiago'),
    disabled: new FormControl({ value: 'No asignado', disabled: true }),
    invalid: new FormControl('', Validators.required),
    search: new FormControl(''),
    checked: new FormControl(true),
    choice: new FormControl('active'),
    toggle: new FormControl(true)
  });

  dataSource = new MatTableDataSource<GuideRow>([
    {
      name: 'robert cliente 3 ayalaa',
      office: 'Agencia Santiago de María',
      status: 'Activo',
      statusClass: 'status-active'
    },
    {
      name: 'Cliente sin asesor',
      office: 'Agencia Santiago de María',
      status: 'Pendiente',
      statusClass: 'status-pending'
    },
    { name: 'Grupo 000000004', office: 'Agencia Usulután', status: 'Aprobado', statusClass: 'status-approved' },
    {
      name: 'Cuenta vencida',
      office: 'Agencia Santiago de María',
      status: 'Vencido',
      statusClass: 'status-active-overdue'
    }
  ]);

  emptySource = new MatTableDataSource<GuideRow>([]);

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    this.form.controls.invalid.markAsTouched();
    this.dataSource.filterPredicate = (row, filter) =>
      `${row.name} ${row.office} ${row.status}`.toLowerCase().includes(filter);
    this.route.paramMap.subscribe((params) => {
      const styleId = params.get('styleId');
      this.focusStyle(styleId);
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.focusStyle(this.route.snapshot.paramMap.get('styleId'));
  }

  stylesIn(group: string): StyleReference[] {
    return this.styles.filter((style) => style.group === group);
  }

  colorsIn(setName: string): StyleReference[] {
    return this.styles.filter((style) => style.set === setName);
  }

  typeScale(): StyleReference[] {
    return this.styles.filter((style) => style.set === 'scale');
  }

  copyStyle(id: string): void {
    const style = styleReferenceById(id);
    if (!style) {
      return;
    }
    this.clipboard.copy(formatStyleReference(style));
    this.copiedId = id;
    window.setTimeout(() => {
      if (this.copiedId === id) {
        this.copiedId = '';
      }
    }, 1500);
  }

  focusStyle(styleId: string | null): void {
    if (!styleId) {
      this.activeStyleId = '';
      this.unknownStyleId = '';
      return;
    }
    const known = styleReferenceById(styleId);
    this.activeStyleId = known ? styleId : '';
    this.unknownStyleId = known ? '' : styleId;
    if (!known) {
      return;
    }
    window.setTimeout(() => {
      document.querySelector(`[data-style-id="${styleId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    if (id === 'index') {
      this.indexOpen = true;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showFocus(button: HTMLButtonElement): void {
    button.focus({ preventScroll: true });
  }

  openSnackbar(): void {
    this.snackBar.open('Cambios guardados', 'Cerrar', { duration: 3000 });
  }

  openDialog(): void {
    this.dialog.open(StyleGuideDialogComponent, { width: '420px' });
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
