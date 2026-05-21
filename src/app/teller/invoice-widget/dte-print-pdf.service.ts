import { Injectable } from '@angular/core';
import { jsPDF, jsPDFOptions } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import {
  DTE_PRINT_FONT,
  DTE_PRINT_LAYOUT,
  DTE_PRINT_SPACE,
  dteFieldRowAdvanceIn,
  dteLineAdvanceIn,
  dtePx,
  dteTotalRowAdvanceIn,
  dteYAfterSectionTitle
} from './dte-print-spacing';
import { DtePrintFieldRow, DtePrintViewModel } from './dte-print-view.model';

export interface DtePrintInvoice {
  tipoDte?: string;
  ambiente?: string;
  numeroControl?: string;
  codigoGeneracion?: string;
  fecEmi?: string | string[];
  horEmi?: string | number[] | { hour?: number; minute?: number; second?: number };
  tipoMoneda?: string;
  selloRecibido?: string;
  emisorNit?: string;
  emisorNrc?: string;
  emisorNombre?: string;
  emisorCodActividad?: string;
  emisorDescActividad?: string;
  emisorDireccionDepartamento?: string;
  emisorDireccionMunicipio?: string;
  emisorDireccionComplemento?: string;
  emisorTelefono?: string;
  emisorCorreo?: string;
  receptorNombre?: string;
  receptorDocId?: string;
  receptorNit?: string;
  receptorNrc?: string;
  receptorDireccionComplemento?: string;
  receptorCorreo?: string;
  receptorTelefono?: string;
  loanId?: number;
  loanProductName?: string;
  loanExternalId?: string;
  lineaCrediticia?: string;
  numeroCredito?: string;
  lines?: Array<{
    numItem?: number;
    descripcion?: string;
    cantidad?: number;
    precioUni?: number;
    ventaGravada?: number;
    ventaExenta?: number;
    ventaNoSuj?: number;
    noGravado?: number;
  }>;
  totalGravada?: number;
  totalExenta?: number;
  totalNoSuj?: number;
  subTotal?: number;
  montoTotalOperacion?: number;
  totalPagar?: number;
  totalLetras?: string;
}

const MAROON: [number, number, number] = [
  107,
  44,
  44
];
const GREY: [number, number, number] = [
  120,
  120,
  120
];
/** Matches preview `.dte-print-table` border (#ccc, ~1px). */
const TABLE_BORDER_COLOR: [number, number, number] = [
  204,
  204,
  204
];
const TABLE_BORDER_WIDTH = 0.01;
const PAGE_MARGIN = DTE_PRINT_LAYOUT.pagePaddingIn;
const LOGO_MAX_IN = DTE_PRINT_LAYOUT.logoBoxIn;
const HEADER_RIGHT_W = DTE_PRINT_LAYOUT.headerRightIn;
const HEADER_GAP = DTE_PRINT_LAYOUT.headerGapIn;
const ID_LABEL_W = DTE_PRINT_LAYOUT.idLabelColIn;
const FIELD_LABEL_W = DTE_PRINT_LAYOUT.fieldLabelColIn;
const TOTALS_W = DTE_PRINT_LAYOUT.totalsWidthIn;
const QR_MAX_IN = DTE_PRINT_LAYOUT.qrMaxIn;

export interface DtePrintPdfOptions {
  /** When set, rasterizes this element so the PDF matches the HTML preview layout. */
  htmlElement?: HTMLElement;
}

@Injectable({ providedIn: 'root' })
export class DtePrintPdfService {
  async buildAndPrint(viewModel: DtePrintViewModel, options?: DtePrintPdfOptions): Promise<void> {
    if (options?.htmlElement) {
      await this.buildAndPrintFromHtml(viewModel, options.htmlElement);
      return;
    }

    const pdfOptions: jsPDFOptions = {
      orientation: 'p',
      unit: 'in',
      format: 'letter',
      compress: true
    };
    const pdf = new jsPDF(pdfOptions);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    const leftColumnW = contentWidth - HEADER_RIGHT_W - HEADER_GAP;
    const rightX = pageWidth - PAGE_MARGIN - HEADER_RIGHT_W;

    let y = await this.drawHeader(pdf, pageWidth, leftColumnW, rightX, viewModel);
    y = this.drawReceptorSection(pdf, pageWidth, y, viewModel.receptor);
    y = this.drawLineItemsTable(pdf, pageWidth, y, viewModel);
    this.drawTotals(pdf, pageWidth, y, viewModel);

    await this.openPdfOutput(pdf, viewModel);
  }

  private async buildAndPrintFromHtml(viewModel: DtePrintViewModel, element: HTMLElement): Promise<void> {
    await this.waitForImages(element);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'in',
      format: 'letter',
      compress: true
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const contentW = pageW - PAGE_MARGIN * 2;
    const contentH = pageH - PAGE_MARGIN * 2;
    let imgW = contentW;
    let imgH = (canvas.height * imgW) / canvas.width;

    if (imgH > contentH) {
      const scale = contentH / imgH;
      imgH = contentH;
      imgW *= scale;
    }

    pdf.addImage(imgData, 'JPEG', PAGE_MARGIN, PAGE_MARGIN, imgW, imgH);
    await this.openPdfOutput(pdf, viewModel);
  }

  private async waitForImages(element: HTMLElement): Promise<void> {
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
      )
    );
  }

  private async openPdfOutput(pdf: jsPDF, viewModel: DtePrintViewModel): Promise<void> {
    pdf.autoPrint();
    const blobUrl = pdf.output('bloburl');
    const control = viewModel.identification.find((r) => r.label === 'Número de control')?.value ?? 'invoice';
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
      pdf.save(`dte-${control}.pdf`);
    }
  }

  private async drawHeader(
    pdf: jsPDF,
    pageWidth: number,
    leftColumnW: number,
    rightX: number,
    viewModel: DtePrintViewModel
  ): Promise<number> {
    const headerTop = PAGE_MARGIN;
    const leftBottom = await this.drawHeaderLeft(pdf, PAGE_MARGIN, headerTop, leftColumnW, viewModel.emisor);
    const rightBottom = await this.drawHeaderRight(pdf, rightX, HEADER_RIGHT_W, headerTop, viewModel);
    return Math.max(leftBottom, rightBottom) + DTE_PRINT_SPACE.headerMarginBottom;
  }

  private async drawHeaderLeft(
    pdf: jsPDF,
    x: number,
    startY: number,
    columnW: number,
    emisor: DtePrintFieldRow[]
  ): Promise<number> {
    const logo = await this.loadLogoAsset();
    let y = startY;

    if (logo) {
      const { width, height } = fitLogoDimensions(logo.naturalWidth, logo.naturalHeight, LOGO_MAX_IN);
      const logoY = startY + (LOGO_MAX_IN - height) / 2;
      pdf.addImage(logo.dataUrl, 'PNG', x, logoY, width, height);
    }

    const textX = x + LOGO_MAX_IN + DTE_PRINT_LAYOUT.brandLogoTextGapIn;
    const brandMidY = startY + LOGO_MAX_IN / 2;
    const nameBaseline = brandMidY - dteLineAdvanceIn(28) / 2 + dtePx(2);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(DTE_PRINT_FONT.brandName);
    pdf.setTextColor(...GREY);
    pdf.text('CREDESAL', textX, nameBaseline);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(DTE_PRINT_FONT.brandTagline);
    pdf.text('AHORRO Y CRÉDITO', textX, nameBaseline + dteLineAdvanceIn(28) + DTE_PRINT_SPACE.brandTaglineMarginTop);
    pdf.setTextColor(0, 0, 0);

    const brandBottom = startY + LOGO_MAX_IN + DTE_PRINT_SPACE.brandPaddingBottom;
    y = brandBottom;
    return this.drawInlinePartySection(pdf, x, y, columnW, 'EMISOR', emisor, startY + LOGO_MAX_IN);
  }

  private async drawHeaderRight(
    pdf: jsPDF,
    columnX: number,
    columnW: number,
    headerTop: number,
    viewModel: DtePrintViewModel
  ): Promise<number> {
    const padY = DTE_PRINT_SPACE.docTypePaddingY;
    const labelBaseline = headerTop + padY + dteLineAdvanceIn(9) * 0.75;
    const titleBaseline = labelBaseline + DTE_PRINT_SPACE.docTypeTitleMarginTop + dteLineAdvanceIn(11) * 0.75;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(DTE_PRINT_FONT.docTypeLabel);
    const titleLines = pdf.splitTextToSize(viewModel.documentTitle, columnW - dtePx(24));
    const titleBlockH = dteLineAdvanceIn(11, titleLines.length);
    const bannerH = padY * 2 + dteLineAdvanceIn(9) + DTE_PRINT_SPACE.docTypeTitleMarginTop + titleBlockH;

    pdf.setFillColor(...MAROON);
    pdf.rect(columnX, headerTop, columnW, bannerH, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('TIPO DE DOCUMENTO', columnX + columnW / 2, labelBaseline, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(DTE_PRINT_FONT.docTypeTitle);
    pdf.text(titleLines, columnX + columnW / 2, titleBaseline, { align: 'center' });
    pdf.setTextColor(0, 0, 0);

    let y = headerTop + bannerH + DTE_PRINT_SPACE.docTypeIdentificationGap;
    y = this.drawGridPartySection(pdf, columnX, y, columnW, 'IDENTIFICACIÓN', viewModel.identification, ID_LABEL_W);
    return this.drawQrInColumn(pdf, columnX, columnW, y, viewModel.qrUrl);
  }

  private drawInlinePartySection(
    pdf: jsPDF,
    x: number,
    startY: number,
    columnW: number,
    title: string,
    fields: DtePrintFieldRow[],
    minBottom: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(DTE_PRINT_FONT.sectionTitle);
    pdf.text(title, x, startY);
    let y = dteYAfterSectionTitle(startY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(DTE_PRINT_FONT.base);

    fields.forEach((row) => {
      pdf.setFont('helvetica', 'bold');
      const labelText = `${row.label}: `;
      const labelW = pdf.getTextWidth(labelText);
      pdf.text(labelText, x, y);
      pdf.setFont('helvetica', 'normal');
      const valueLines = pdf.splitTextToSize(row.value, Math.max(0.5, columnW - labelW));
      pdf.text(valueLines, x + labelW, y);
      y += dteFieldRowAdvanceIn(11, valueLines.length);
    });

    return Math.max(y - DTE_PRINT_SPACE.fieldsRowGap, minBottom);
  }

  private drawGridPartySection(
    pdf: jsPDF,
    x: number,
    startY: number,
    columnW: number,
    title: string,
    fields: DtePrintFieldRow[],
    labelW: number,
    columnCount: 1 | 2 = 1
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(DTE_PRINT_FONT.sectionTitle);
    pdf.text(title, x, startY);
    let y = dteYAfterSectionTitle(startY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(DTE_PRINT_FONT.base);

    if (columnCount === 1) {
      fields.forEach((row) => {
        y += this.drawGridPartyFieldRow(pdf, x, y, columnW, row, labelW);
      });
      return y - DTE_PRINT_SPACE.fieldsRowGap;
    }

    const colGap = DTE_PRINT_SPACE.receptorFieldsColumnGap;
    const fieldColW = (columnW - colGap) / 2;
    const rightX = x + fieldColW + colGap;

    for (let i = 0; i < fields.length; ) {
      const row = fields[i];
      if (row.column === 2) {
        y += this.drawGridPartyFieldRow(pdf, rightX, y, fieldColW, row, labelW);
        i += 1;
        continue;
      }

      const leftAdvance = this.drawGridPartyFieldRow(pdf, x, y, fieldColW, row, labelW);
      const rightRow = fields[i + 1];
      if (!rightRow || rightRow.column === 2) {
        y += leftAdvance;
        i += 1;
        continue;
      }

      const rightAdvance = this.drawGridPartyFieldRow(pdf, rightX, y, fieldColW, rightRow, labelW);
      y += Math.max(leftAdvance, rightAdvance);
      i += 2;
    }

    return y - DTE_PRINT_SPACE.fieldsRowGap;
  }

  private drawGridPartyFieldRow(
    pdf: jsPDF,
    x: number,
    y: number,
    columnW: number,
    row: DtePrintFieldRow,
    labelW: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${row.label}:`, x, y);
    pdf.setFont('helvetica', 'normal');
    const valueLines = pdf.splitTextToSize(row.value, columnW - labelW - dtePx(8));
    pdf.text(valueLines, x + labelW, y);
    return dteFieldRowAdvanceIn(11, valueLines.length);
  }

  private async drawQrInColumn(
    pdf: jsPDF,
    columnX: number,
    columnW: number,
    startY: number,
    qrUrl: string
  ): Promise<number> {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 120 });
    const qrSize = Math.min(QR_MAX_IN, columnW - dtePx(16));
    const qrX = columnX + (columnW - qrSize) / 2;
    const qrY = startY + DTE_PRINT_SPACE.qrMarginTop;
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(DTE_PRINT_FONT.qrCaption);
    pdf.setTextColor(...GREY);
    const captionY = qrY + qrSize + DTE_PRINT_SPACE.qrCaptionMarginTop + dteLineAdvanceIn(10) * 0.75;
    pdf.text('Consulta pública MH', columnX + columnW / 2, captionY, { align: 'center' });
    pdf.setFontSize(DTE_PRINT_FONT.qrUrl);
    const urlLines = pdf.splitTextToSize(qrUrl, columnW);
    const urlY = captionY + DTE_PRINT_SPACE.qrUrlMarginTop + dteLineAdvanceIn(8) * 0.5;
    pdf.text(urlLines, columnX + columnW / 2, urlY, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    return urlY + dteLineAdvanceIn(8, urlLines.length);
  }

  private drawReceptorSection(pdf: jsPDF, pageWidth: number, startY: number, receptor: DtePrintFieldRow[]): number {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(dtePx(1));
    pdf.line(PAGE_MARGIN, startY, pageWidth - PAGE_MARGIN, startY);

    const sectionY = startY + DTE_PRINT_SPACE.receptorPaddingTop;
    const sectionBottom = this.drawGridPartySection(
      pdf,
      PAGE_MARGIN,
      sectionY,
      pageWidth - PAGE_MARGIN * 2,
      'RECEPTOR',
      receptor,
      DTE_PRINT_LAYOUT.receptorFieldLabelColIn,
      2
    );
    return sectionBottom + DTE_PRINT_SPACE.sectionMarginBottom;
  }

  private drawLineItemsTable(pdf: jsPDF, pageWidth: number, startY: number, viewModel: DtePrintViewModel): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(DTE_PRINT_FONT.sectionTitle);
    pdf.text('DETALLE', PAGE_MARGIN, startY);

    const body = viewModel.lines.map((line) => [
      line.numItem,
      line.descripcion,
      line.cantidad,
      line.precioUni,
      line.ventaGravada,
      line.ventaExenta,
      line.ventaNoSuj,
      line.noGravado
    ]);

    autoTable(pdf, {
      startY: dteYAfterSectionTitle(startY),
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [[
          '#',
          'Descripción',
          'Cant.',
          'Precio',
          'Gravada',
          'Exenta',
          'No Suj.',
          'No Grav.'
        ]],
      body,
      theme: 'grid',
      tableLineWidth: TABLE_BORDER_WIDTH,
      tableLineColor: TABLE_BORDER_COLOR,
      styles: {
        fontSize: DTE_PRINT_FONT.table,
        cellPadding: {
          top: DTE_PRINT_SPACE.tableCellPaddingY,
          bottom: DTE_PRINT_SPACE.tableCellPaddingY,
          left: DTE_PRINT_SPACE.tableCellPaddingX,
          right: DTE_PRINT_SPACE.tableCellPaddingX
        },
        lineColor: TABLE_BORDER_COLOR,
        lineWidth: TABLE_BORDER_WIDTH
      },
      headStyles: {
        fillColor: MAROON,
        textColor: [
          255,
          255,
          255
        ],
        lineColor: TABLE_BORDER_COLOR,
        lineWidth: TABLE_BORDER_WIDTH
      },
      bodyStyles: {
        lineColor: TABLE_BORDER_COLOR,
        lineWidth: TABLE_BORDER_WIDTH
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      }
    });
    return (pdf as any).lastAutoTable.finalY + DTE_PRINT_SPACE.sectionMarginBottom;
  }

  private drawTotals(pdf: jsPDF, pageWidth: number, startY: number, viewModel: DtePrintViewModel): void {
    const totalsX = pageWidth - PAGE_MARGIN - TOTALS_W;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(DTE_PRINT_FONT.sectionTitle);
    pdf.text('RESUMEN', totalsX, startY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(DTE_PRINT_FONT.base);

    let y = dteYAfterSectionTitle(startY);
    viewModel.totals.forEach((row) => {
      pdf.setFont('helvetica', 'normal');
      pdf.text(row.label, totalsX, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(row.value, pageWidth - PAGE_MARGIN, y, { align: 'right' });
      y += dteTotalRowAdvanceIn();
    });

    if (viewModel.totalLetras) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(DTE_PRINT_FONT.totalLetras);
      const letras = pdf.splitTextToSize(viewModel.totalLetras, pageWidth - PAGE_MARGIN * 2);
      pdf.text(letras, PAGE_MARGIN, y + DTE_PRINT_SPACE.totalLetrasMarginTop);
    }
  }

  private async loadLogoAsset(): Promise<{ dataUrl: string; naturalWidth: number; naturalHeight: number } | null> {
    for (const path of [
      'assets/images/credesal-imagotipo.png',
      'assets/images/credesal-dte-logo.png'
    ]) {
      const dataUrl = await this.fetchImageAsDataUrl(path);
      if (dataUrl) {
        const dimensions = await this.readImageDimensions(dataUrl);
        if (dimensions) {
          return { dataUrl, ...dimensions };
        }
      }
    }
    return null;
  }

  private readImageDimensions(dataUrl: string): Promise<{ naturalWidth: number; naturalHeight: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  private async fetchImageAsDataUrl(path: string): Promise<string | null> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}

/** Scale logo to fit inside a square max box, preserving aspect ratio (like CSS object-fit: contain). */
export function fitLogoDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxIn: number
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0 || maxIn <= 0) {
    return { width: maxIn, height: maxIn };
  }
  const scale = Math.min(maxIn / naturalWidth, maxIn / naturalHeight);
  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale
  };
}

export function mapTipoDteToTitle(tipoDte?: string): string {
  const code = String(tipoDte ?? '').trim();
  switch (code) {
    case '01':
      return 'FACTURA CONSUMIDOR FINAL';
    case '03':
      return 'COMPROBANTE DE CRÉDITO FISCAL';
    case '05':
      return 'NOTA DE CRÉDITO';
    case '06':
      return 'NOTA DE DÉBITO';
    case '14':
      return 'FACTURA DE SUJETO EXCLUIDO';
    default:
      return code ? `TIPO DTE ${code}` : 'DOCUMENTO TRIBUTARIO ELECTRÓNICO';
  }
}

export function buildMhConsultaUrl(invoice: DtePrintInvoice): string {
  const ambiente = String(invoice.ambiente ?? '00').trim();
  const isProduction = ambiente === '01' || ambiente === '1' || ambiente.toLowerCase() === 'prod';
  const base = isProduction
    ? 'https://portaldgii.mh.gob.sv/ssc/consulta/fe'
    : 'https://test7.mh.gob.sv/ssc/consulta/fe';
  const params = new URLSearchParams();
  if (invoice.codigoGeneracion) {
    params.set('codigoGeneracion', invoice.codigoGeneracion);
  }
  const fecEmi = invoice.fecEmi;
  if (fecEmi) {
    const dateStr = Array.isArray(fecEmi) ? fecEmi.slice(0, 3).join('-') : String(fecEmi).slice(0, 10);
    params.set('fechaEmi', dateStr);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
