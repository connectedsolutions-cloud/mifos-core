import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { MatButton } from '@angular/material/button';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SharesService } from '../../shares.service';

@Component({
  selector: 'mifosx-certificates-tab',
  templateUrl: './certificates-tab.component.html',
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
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
    MatButton
  ]
})
export class CertificatesTabComponent implements OnInit {
  certificates: any[] = [];
  selected: any;
  columns = [
    'displayNumber',
    'status',
    'shareSerials',
    'representedShares',
    'folio',
    'lineNumber'
  ];
  private shareAccountId: string;

  constructor(
    private route: ActivatedRoute,
    private sharesService: SharesService
  ) {}

  ngOnInit(): void {
    this.shareAccountId =
      this.route.parent?.parent?.snapshot.paramMap.get('shareAccountId') ||
      this.route.parent?.snapshot.paramMap.get('shareAccountId');
    this.load();
  }

  load(): void {
    this.sharesService.getShareCertificates(this.shareAccountId).subscribe((certificates: any[]) => {
      this.certificates = certificates || [];
      if (this.selected) {
        this.selected = this.certificates.find((certificate) => certificate.id === this.selected.id) || null;
      }
    });
  }

  select(certificate: any): void {
    this.sharesService.getShareCertificate(certificate.id).subscribe((detail: any) => {
      this.selected = detail;
    });
  }

  emitCertificate(): void {
    this.sharesService.emitShareCertificate(this.selected.id).subscribe(() => {
      this.select(this.selected);
      this.load();
    });
  }

  printCertificate(): void {
    const certificate = this.selected;
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
    if (!popup) {
      return;
    }
    popup.document.write(this.printDocument(certificate));
    popup.document.close();
    popup.focus();
    popup.print();
    this.sharesService.markShareCertificatePrinted(certificate.id).subscribe(() => this.load());
  }

  private printDocument(certificate: any): string {
    const beneficiaries = (certificate.beneficiaries || [])
      .map(
        (beneficiary: any) =>
          `<li>${beneficiary.firstNames || ''} ${beneficiary.lastNames || ''} — ${beneficiary.relationship || ''} ${beneficiary.percentage || ''}%</li>`
      )
      .join('');
    return `<!DOCTYPE html><html lang="es"><head><title>Certificado de acciones</title>
      <style>body{font-family:Georgia,serif;margin:48px;color:#1a1a1a}h1{font-size:22px}table{width:100%;border-collapse:collapse}td{padding:6px 0;vertical-align:top}</style>
      </head><body>
      <h1>Certificado de acciones</h1>
      <table>
        <tr><td>Clase</td><td>${certificate.shareTypeName || ''}</td></tr>
        <tr><td>Número de certificado</td><td>${certificate.certificateNumber || ''}</td></tr>
        <tr><td>Número provisional</td><td>${certificate.provisionalNumber || ''}</td></tr>
        <tr><td>Estado</td><td>${certificate.status || ''}</td></tr>
        <tr><td>Acciones</td><td>${certificate.representedShares ?? ''}</td></tr>
        <tr><td>Números de acción</td><td>${certificate.shareSerialStart ?? ''} – ${certificate.shareSerialEnd ?? ''}</td></tr>
        <tr><td>Valor</td><td>${certificate.unitPrice ?? ''}</td></tr>
        <tr><td>Fecha de certificado</td><td>${certificate.certificateDate ?? ''}</td></tr>
        <tr><td>Libro</td><td>${certificate.bookId ?? ''}</td></tr>
        <tr><td>Serie</td><td>${certificate.series ?? ''}</td></tr>
        <tr><td>Número de libro</td><td>${certificate.bookNumber ?? ''}</td></tr>
        <tr><td>Fecha de libro</td><td>${certificate.bookDate ?? ''}</td></tr>
        <tr><td>Folio / línea</td><td>${certificate.folio ?? ''} / ${certificate.lineNumber ?? ''}</td></tr>
        <tr><td>Saldo de acciones</td><td>${certificate.currentBalance ?? ''}</td></tr>
        <tr><td>Saldo pignorado</td><td>${certificate.pledgedBalance ?? ''}</td></tr>
      </table>
      <h2>Beneficiarios</h2>
      <ul>${beneficiaries}</ul>
      </body></html>`;
  }
}
