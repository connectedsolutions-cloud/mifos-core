import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { ClientsService } from 'app/clients/clients.service';
import { LoansService } from 'app/loans/loans.service';
import { OrganizationService } from 'app/organization/organization.service';
import { ProductsService } from 'app/products/products.service';
import { enrichInvoiceWithLineTotals, resolveInvoiceLinesForPrint } from './dte-line-preview.mapper';
import { enrichDtePrintInvoiceWithLoanFields, resolveLoanIdForFetch } from './dte-print-loan-fields';
import { DtePrintDocumentComponent } from './dte-print-document.component';
import { DtePrintPdfService } from './dte-print-pdf.service';
import { buildDtePrintViewModel, buildSampleDtePrintInvoice, DtePrintViewModel } from './dte-print-view.model';

type InvoiceTransactionType = 'loans' | 'savings' | 'client';

@Component({
  selector: 'mifosx-dte-print-preview',
  templateUrl: './dte-print-preview.component.html',
  styleUrls: ['./dte-print-preview.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    DtePrintDocumentComponent
  ]
})
export class DtePrintPreviewComponent implements OnInit {
  @ViewChild(DtePrintDocumentComponent)
  private printDocument?: DtePrintDocumentComponent;

  viewModel: DtePrintViewModel | null = null;
  invoice: any = null;
  loading = true;
  loadError = '';
  pdfGenerating = false;
  currencyCode = 'USD';

  private lastIsLoanTransaction = false;
  private lastLinePreview: { lines?: unknown[] } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private organizationService: OrganizationService,
    private loansService: LoansService,
    private clientsService: ClientsService,
    private productsService: ProductsService,
    private dtePrintPdfService: DtePrintPdfService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(() => this.reload());
  }

  reload(): void {
    const params = this.route.snapshot.queryParamMap;
    this.currencyCode = params.get('currencyCode') ?? 'USD';

    if (params.get('sample') === '1') {
      this.lastIsLoanTransaction = false;
      this.lastLinePreview = null;
      this.applyInvoice(buildSampleDtePrintInvoice(), null, false);
      this.loading = false;
      return;
    }

    const entityType = (params.get('entityType') ?? 'loans') as InvoiceTransactionType;
    const loanTransactionId = this.parseId(params.get('loanTransactionId'));
    const savingsTransactionId = this.parseId(params.get('savingsTransactionId'));
    const clientTransactionId = this.parseId(params.get('clientTransactionId'));

    let transactionId: number | null = null;
    let resolvedType: InvoiceTransactionType = entityType;

    if (loanTransactionId != null) {
      transactionId = loanTransactionId;
      resolvedType = 'loans';
    } else if (savingsTransactionId != null) {
      transactionId = savingsTransactionId;
      resolvedType = 'savings';
    } else if (clientTransactionId != null) {
      transactionId = clientTransactionId;
      resolvedType = 'client';
    }

    if (transactionId == null) {
      this.loading = false;
      this.loadError =
        'Indica loanTransactionId, savingsTransactionId o clientTransactionId en la URL, o usa ?sample=1 para datos de ejemplo.';
      this.viewModel = null;
      this.invoice = null;
      return;
    }

    const queryLoanId = this.parseId(params.get('loanId'));
    const isLoanTransaction = resolvedType === 'loans';

    this.loading = true;
    this.loadError = '';
    this.organizationService
      .getInvoiceByTransaction(resolvedType, transactionId)
      .pipe(
        switchMap((invoice: any) => {
          if (!invoice?.id) {
            return of({ invoice: null, loanAccount: null, client: null, linePreview: null });
          }
          const loanId = resolveLoanIdForFetch(invoice, queryLoanId);
          const loanAccount$ =
            isLoanTransaction && loanId != null
              ? this.loansService.getLoanAccountResource(String(loanId), '').pipe(catchError(() => of(null)))
              : of(null);
          return loanAccount$.pipe(
            switchMap((loanAccount: any) => {
              const clientId = loanAccount?.clientId;
              const client$ =
                clientId != null
                  ? this.clientsService.getClientData(String(clientId)).pipe(catchError(() => of(null)))
                  : of(null);
              const linePreview$ = isLoanTransaction
                ? client$.pipe(
                    switchMap((client: any) =>
                      this.productsService
                        .previewMhDteItemComponent(transactionId, client?.clientType?.name, false)
                        .pipe(catchError(() => of(null)))
                    )
                  )
                : of(null);
              return forkJoin({
                invoice: of(invoice),
                loanAccount: of(loanAccount),
                linePreview: linePreview$
              });
            })
          );
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: ({ invoice, loanAccount, linePreview }) => {
          if (!invoice?.id) {
            this.loadError = 'No se encontró factura para esta transacción.';
            this.viewModel = null;
            this.invoice = null;
            return;
          }
          this.lastIsLoanTransaction = isLoanTransaction;
          this.lastLinePreview = linePreview;
          const enriched = enrichDtePrintInvoiceWithLoanFields(invoice, isLoanTransaction, loanAccount);
          this.applyInvoice(enriched, linePreview, isLoanTransaction);
        },
        error: () => {
          this.loadError = 'Error al cargar la factura.';
          this.viewModel = null;
          this.invoice = null;
        }
      });
  }

  loadSample(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sample: '1' },
      queryParamsHandling: 'merge'
    });
  }

  print(): void {
    window.print();
  }

  downloadPdf(): void {
    if (!this.invoice) {
      return;
    }
    const viewModel = buildDtePrintViewModel(this.invoice, this.currencyCode);
    const htmlElement = this.printDocument?.getPrintPageElement() ?? undefined;
    this.pdfGenerating = true;
    this.dtePrintPdfService
      .buildAndPrint(viewModel, { htmlElement })
      .catch(() => {
        this.loadError = 'No se pudo generar el PDF.';
      })
      .finally(() => (this.pdfGenerating = false));
  }

  private applyInvoice(invoice: any, linePreview: { lines?: unknown[] } | null, isLoanTransaction: boolean): void {
    const lines = resolveInvoiceLinesForPrint(invoice, linePreview, isLoanTransaction);
    this.invoice = enrichInvoiceWithLineTotals({ ...invoice, lines }, lines);
    this.viewModel = buildDtePrintViewModel(this.invoice, this.currencyCode);
    this.loadError = '';
  }

  private parseId(raw: string | null): number | null {
    if (!raw) {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
