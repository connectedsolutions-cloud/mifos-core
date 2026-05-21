import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { buildAppRouteAbsoluteUrl, openAppRouteInNewTab } from 'app/core/utils/open-app-route';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { ClientsService } from 'app/clients/clients.service';
import { LoansService } from 'app/loans/loans.service';
import { OrganizationService } from 'app/organization/organization.service';
import { ProductsService } from 'app/products/products.service';
import { FormatNumberPipe } from 'app/pipes/format-number.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { DtePrintPdfService } from './dte-print-pdf.service';
import { buildDtePrintViewModel } from './dte-print-view.model';
import {
  enrichInvoiceWithLineTotals,
  mapPreviewLineToRow,
  resolveInvoiceLinesForPrint
} from './dte-line-preview.mapper';
import {
  enrichDtePrintInvoiceWithLoanFields,
  normalizeLoanCreditInfo,
  resolveLineaCrediticia,
  resolveNumeroCredito
} from './dte-print-loan-fields';

type InvoiceTransactionType = 'loans' | 'savings' | 'client';

export interface InvoiceWidgetDialogData {
  transactionId: number;
  entityType: InvoiceTransactionType;
  transactionNote?: string;
  currencyCode?: string;
  loanId?: number;
}

export interface InvoiceLineTableRow {
  cantidad: number;
  descripcion: string;
  precioUni: number;
  noGravado: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
}

interface ClientReceptorDefaults {
  receptorTipoDocumento: string;
  receptorDocId: string;
  receptorCodActividad: string;
  receptorDescActividad: string;
  receptorDireccionDepartamento: string;
  receptorDireccionMunicipio: string;
  receptorDireccionComplemento: string;
}

@Component({
  selector: 'mifosx-invoice-widget',
  templateUrl: './invoice-widget.component.html',
  styleUrls: ['./invoice-widget.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    FormatNumberPipe,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class InvoiceWidgetComponent implements OnInit {
  form: FormGroup;
  loading = true;
  submitting = false;
  validating = false;
  lookupError = '';
  submitError = '';
  invoice: any = null;
  clientInfo: any = null;
  loanAccount: any = null;
  readonlyMode = false;
  printing = false;

  lineItems: InvoiceLineTableRow[] = [];
  linePreview: { lines?: unknown[] } | null = null;
  linePreviewLoading = false;
  linePreviewError = '';
  linePreviewWarnings: string[] = [];

  readonly lineTableColumns: string[] = [
    'cantidad',
    'descripcion',
    'precioUni',
    'noGravado',
    'ventaNoSuj',
    'ventaExenta',
    'ventaGravada'
  ];

  readonly tipoEstablecimientoCode = '01';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: InvoiceWidgetDialogData,
    private dialogRef: MatDialogRef<InvoiceWidgetComponent>,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    private clientsService: ClientsService,
    private productsService: ProductsService,
    private loansService: LoansService,
    private snackBar: MatSnackBar,
    private dtePrintPdfService: DtePrintPdfService,
    private router: Router,
    private location: Location
  ) {
    this.form = this.fb.group({
      receptorTipoDocumento: [
        '13',
        [Validators.pattern(/^(36|13|02|03|37)$/)]
      ],
      receptorNombre: [
        '',
        Validators.required
      ],
      receptorDocId: [''],
      receptorNit: [''],
      receptorNrc: [''],
      receptorCodActividad: [
        '',
        [
          Validators.minLength(5),
          Validators.maxLength(6),
          Validators.pattern(/^[0-9]{2,6}$/)]
      ],
      receptorDescActividad: [
        '',
        [
          Validators.minLength(5),
          Validators.maxLength(150)]
      ],
      receptorNombreComercial: [''],
      receptorDireccionDepartamento: [
        '',
        Validators.pattern(/^(0[1-9]|1[0-4])$/)],
      receptorDireccionMunicipio: [
        '',
        Validators.pattern(/^[0-9]{2}$/)],
      receptorDireccionComplemento: [
        '',
        [
          Validators.minLength(5),
          Validators.maxLength(200)]
      ],
      receptorCorreo: [
        '',
        Validators.email
      ],
      receptorTelefono: ['']
    });
  }

  get isLoanTransaction(): boolean {
    return this.data.entityType === 'loans';
  }

  get emissionDateDisplay(): string {
    return this.formatEmissionDate(this.invoice?.fecEmi);
  }

  get lineaCrediticiaDisplay(): string {
    return resolveLineaCrediticia(this.isLoanTransaction, this.loanCreditInfo);
  }

  get numeroCreditoDisplay(): string {
    return resolveNumeroCredito(this.isLoanTransaction, this.loanCreditInfo);
  }

  private get loanCreditInfo() {
    return normalizeLoanCreditInfo(this.invoice, this.loanAccount);
  }

  ngOnInit(): void {
    const parsed = this.extractClientFromNote(this.data.transactionNote);
    const clientRequest$ = parsed?.clientId ? this.clientsService.getClientData(String(parsed.clientId)) : of(null);
    const datatableRequest$ = parsed?.clientId
      ? this.clientsService
          .getClientDatatable(String(parsed.clientId), 'credesal_client_datos_personales')
          .pipe(catchError(() => of(null)))
      : of(null);

    const loanAccount$ =
      this.data.loanId != null
        ? this.loansService.getLoanAccountResource(String(this.data.loanId), '').pipe(catchError(() => of(null)))
        : of(null);

    forkJoin({
      invoice: this.organizationService.getInvoiceByTransaction(this.data.entityType, this.data.transactionId),
      client: clientRequest$,
      clientDatatable: datatableRequest$,
      loanAccount: loanAccount$
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ invoice, client, clientDatatable, loanAccount }) => {
          this.invoice = invoice ?? null;
          this.clientInfo = client;
          this.loanAccount = loanAccount;
          this.readonlyMode = this.isInvoiceReadOnly(this.invoice);
          const datatableDefaults = this.extractReceptorDefaults(clientDatatable);

          this.form.patchValue({
            receptorNombre: this.invoice?.receptorNombre ?? parsed?.clientName ?? client?.displayName ?? '',
            receptorTipoDocumento:
              this.invoice?.receptorTipoDocumento ?? datatableDefaults.receptorTipoDocumento ?? '13',
            receptorDocId: this.invoice?.receptorDocId ?? datatableDefaults.receptorDocId ?? client?.externalId ?? '',
            receptorNit: this.invoice?.receptorNit ?? '',
            receptorNrc: this.invoice?.receptorNrc ?? '',
            receptorCodActividad: this.invoice?.receptorCodActividad ?? datatableDefaults.receptorCodActividad ?? '',
            receptorDescActividad: this.invoice?.receptorDescActividad ?? datatableDefaults.receptorDescActividad ?? '',
            receptorNombreComercial: this.invoice?.receptorNombreComercial ?? '',
            receptorDireccionDepartamento:
              this.invoice?.receptorDireccionDepartamento ?? datatableDefaults.receptorDireccionDepartamento ?? '',
            receptorDireccionMunicipio:
              this.invoice?.receptorDireccionMunicipio ?? datatableDefaults.receptorDireccionMunicipio ?? '',
            receptorDireccionComplemento:
              this.invoice?.receptorDireccionComplemento ?? datatableDefaults.receptorDireccionComplemento ?? '',
            receptorCorreo: this.invoice?.receptorCorreo ?? client?.emailAddress ?? '',
            receptorTelefono: this.invoice?.receptorTelefono ?? client?.mobileNo ?? ''
          });

          if (this.readonlyMode) {
            this.form.disable();
          }

          this.loadLinePreview(client?.clientType?.name);
        },
        error: (err) => {
          this.lookupError =
            err?.error?.errors?.[0]?.defaultUserMessage ?? err?.message ?? 'Unable to load invoice information';
        }
      });
  }

  saveAndValidate(): void {
    if (this.form.invalid || this.readonlyMode || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitError = '';
    const values = this.form.getRawValue();

    const ensureInvoice$ = this.invoice?.id
      ? of(this.invoice)
      : this.organizationService.createInvoiceDraft(this.buildDraftPayload(values));

    ensureInvoice$
      .pipe(
        switchMap((invoice: any) => {
          this.invoice = invoice;
          return this.organizationService.updateInvoiceMetadata(Number(invoice.id), {
            receptorTipoDocumento: values.receptorTipoDocumento || '13',
            receptorNombre: values.receptorNombre,
            receptorDocId: values.receptorDocId || null,
            receptorNit: values.receptorNit || null,
            receptorNrc: values.receptorNrc || null,
            receptorCodActividad: values.receptorCodActividad || null,
            receptorDescActividad: values.receptorDescActividad || null,
            receptorNombreComercial: values.receptorNombreComercial || null,
            receptorDireccionDepartamento: values.receptorDireccionDepartamento || null,
            receptorDireccionMunicipio: values.receptorDireccionMunicipio || null,
            receptorDireccionComplemento: values.receptorDireccionComplemento || null,
            receptorCorreo: values.receptorCorreo || null,
            receptorTelefono: values.receptorTelefono || null
          });
        }),
        switchMap((updatedInvoice: any) => {
          this.invoice = updatedInvoice;
          this.validating = true;
          return this.organizationService.validateInvoiceById(Number(updatedInvoice.id));
        }),
        finalize(() => {
          this.submitting = false;
          this.validating = false;
        })
      )
      .subscribe({
        next: (validatedInvoice: any) => {
          this.invoice = validatedInvoice;
          this.readonlyMode = this.isInvoiceReadOnly(this.invoice);
          if (this.readonlyMode) {
            this.form.disable();
          }
          this.snackBar.open('Invoice validation submitted successfully', undefined, { duration: 3500 });
        },
        error: (err) => {
          this.submitError =
            err?.error?.errors?.[0]?.defaultUserMessage ?? err?.message ?? 'Failed to submit invoice validation';
        }
      });
  }

  close(): void {
    this.dialogRef.close(this.invoice ?? true);
  }

  openDtePreview(): void {
    if (!this.invoice?.id) {
      return;
    }
    const queryParams: Record<string, string | number> = {
      currencyCode: this.data.currencyCode ?? 'USD',
      entityType: this.data.entityType
    };
    if (this.data.entityType === 'loans') {
      queryParams.loanTransactionId = this.data.transactionId;
      if (this.data.loanId != null) {
        queryParams.loanId = this.data.loanId;
      }
    } else if (this.data.entityType === 'savings') {
      queryParams.savingsTransactionId = this.data.transactionId;
    } else {
      queryParams.clientTransactionId = this.data.transactionId;
    }
    const previewUrl = buildAppRouteAbsoluteUrl(this.router, this.location, ['/dte-preview'], queryParams);
    console.log('[InvoiceWidget] Preview DTE button clicked, opening URL:', previewUrl);
    openAppRouteInNewTab(this.router, this.location, ['/dte-preview'], queryParams);
  }

  printDte(): void {
    if (!this.invoice?.id || this.printing) {
      return;
    }

    this.printing = true;
    this.organizationService
      .getInvoiceByTransaction(this.data.entityType, this.data.transactionId)
      .pipe(finalize(() => (this.printing = false)))
      .subscribe({
        next: async (invoice: any) => {
          if (!invoice?.id) {
            this.snackBar.open('Unable to load invoice for printing', undefined, { duration: 4000 });
            return;
          }
          this.invoice = invoice;
          try {
            const lines = resolveInvoiceLinesForPrint(invoice, this.linePreview, this.isLoanTransaction);
            const printInvoice = enrichDtePrintInvoiceWithLoanFields(
              enrichInvoiceWithLineTotals({ ...invoice, lines }, lines),
              this.isLoanTransaction,
              this.loanAccount
            );
            const viewModel = buildDtePrintViewModel(printInvoice, this.data.currencyCode ?? 'USD');
            await this.dtePrintPdfService.buildAndPrint(viewModel);
          } catch {
            this.snackBar.open('Failed to generate DTE PDF', undefined, { duration: 4000 });
          }
        },
        error: () => {
          this.snackBar.open('Failed to generate DTE PDF', undefined, { duration: 4000 });
        }
      });
  }

  static mapPreviewLineToRow = mapPreviewLineToRow;

  formatEmissionDate(fecEmi?: string | { year?: number; month?: number; day?: number }): string {
    if (fecEmi != null && typeof fecEmi === 'object' && fecEmi.year != null) {
      const m = String(fecEmi.month ?? 1).padStart(2, '0');
      const d = String(fecEmi.day ?? 1).padStart(2, '0');
      return `${fecEmi.year}-${m}-${d}`;
    }
    if (typeof fecEmi === 'string' && fecEmi.trim() !== '') {
      return fecEmi.slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  }

  private loadLinePreview(clientType?: string): void {
    if (this.data.entityType !== 'loans') {
      return;
    }
    this.linePreviewLoading = true;
    this.linePreviewError = '';
    this.productsService
      .previewMhDteItemComponent(this.data.transactionId, clientType, false)
      .pipe(
        catchError((err) => of({ error: err })),
        finalize(() => (this.linePreviewLoading = false))
      )
      .subscribe((linePreview) => this.applyLinePreview(linePreview));
  }

  private applyLinePreview(linePreview: any): void {
    if (this.data.entityType !== 'loans') {
      return;
    }
    if (linePreview?.error) {
      const err = linePreview.error;
      this.linePreviewError =
        err?.error?.errors?.[0]?.defaultUserMessage ?? err?.message ?? 'Unable to load line preview';
      return;
    }
    if (!linePreview) {
      return;
    }
    this.linePreview = linePreview;
    this.linePreviewWarnings = Array.isArray(linePreview.warnings) ? linePreview.warnings : [];
    const lines = Array.isArray(linePreview.lines) ? linePreview.lines : [];
    this.lineItems = lines.map((line: any) => mapPreviewLineToRow(line));
  }

  private isInvoiceReadOnly(invoice: any): boolean {
    if (!invoice) {
      return false;
    }
    const status = String(invoice.status ?? '').toUpperCase();
    const mhStatus = String(invoice.mhValidationStatus ?? '').toUpperCase();
    return [
        'GENERATED',
        'SIGNED',
        'SUBMITTED',
        'ACCEPTED'
      ].includes(status) || mhStatus === 'SUCCESS';
  }

  private buildDraftPayload(formValues: any): any {
    const now = new Date();
    const txKey =
      this.data.entityType === 'loans'
        ? 'loanTransactionId'
        : this.data.entityType === 'savings'
          ? 'savingsTransactionId'
          : 'clientTransactionId';

    return {
      [txKey]: this.data.transactionId,
      version: 3,
      ambiente: '00',
      tipoDte: '03',
      codigoGeneracion: this.generateUuidV4(),
      tipoModelo: 1,
      tipoOperacion: 1,
      fecEmi: now.toISOString().slice(0, 10),
      horEmi: now.toTimeString().slice(0, 8),
      tipoMoneda: this.data.currencyCode || 'USD',
      emisorNombre: 'CREDESAL',
      receptorNombre: formValues.receptorNombre,
      lines: []
    };
  }

  private generateUuidV4(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private extractClientFromNote(note?: string): { clientId: number; clientName: string } | null {
    if (!note) {
      return null;
    }
    const match = /Client:(\d+)-([^,]+)/i.exec(note);
    if (!match) {
      return null;
    }
    return {
      clientId: Number(match[1]),
      clientName: match[2]?.trim() ?? ''
    };
  }

  private extractReceptorDefaults(datatable: any): ClientReceptorDefaults {
    const row = datatable?.data?.[0]?.row;
    const headers = datatable?.columnHeaders || [];
    if (!row || !headers.length) {
      return {
        receptorTipoDocumento: '13',
        receptorDocId: '',
        receptorCodActividad: '',
        receptorDescActividad: '',
        receptorDireccionDepartamento: '',
        receptorDireccionMunicipio: '',
        receptorDireccionComplemento: ''
      };
    }

    const getValue = (columnName: string): string => {
      const index = headers.findIndex((header: any) => header.columnName === columnName);
      if (index < 0) {
        return '';
      }
      const value = row[index];
      return value === null || value === undefined ? '' : String(value).trim();
    };

    return {
      receptorTipoDocumento: this.normalizeTipoDocumento(getValue('tipo_documento_identificacion')),
      receptorDocId: getValue('numero_documento_identificacion'),
      receptorCodActividad: getValue('cod_actividad_economica'),
      receptorDescActividad: getValue('desc_actividad_economica') || getValue('ocupacion_actividad_real'),
      receptorDireccionDepartamento: this.normalizeGeographicCode(getValue('departamento')),
      receptorDireccionMunicipio: this.normalizeGeographicCode(getValue('municipio')),
      receptorDireccionComplemento: getValue('direccion_domicilio')
    };
  }

  private normalizeTipoDocumento(rawValue?: string): string {
    const normalized = (rawValue || '').trim().toUpperCase();
    if (!normalized) {
      return '13';
    }
    if ([
        '36',
        '13',
        '02',
        '03',
        '37'
      ].includes(normalized)) {
      return normalized;
    }
    if (normalized.includes('DUI')) {
      return '13';
    }
    return '13';
  }

  private normalizeGeographicCode(rawValue?: string): string {
    const normalized = (rawValue || '').replace(/\D+/g, '');
    return normalized.length === 2 ? normalized : '';
  }
}
