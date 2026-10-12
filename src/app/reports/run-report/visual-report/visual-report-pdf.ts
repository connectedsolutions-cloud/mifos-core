import { jsPDF } from 'jspdf';

export interface VisualReportPaper {
  format: 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  widthPx: number;
  heightPx: number;
}

export interface VisualReportPageSlice {
  y: number;
  height: number;
}

const LETTER_PORTRAIT: VisualReportPaper = {
  format: 'letter',
  orientation: 'portrait',
  widthPx: 816,
  heightPx: 1056
};

const LETTER_LANDSCAPE: VisualReportPaper = {
  format: 'letter',
  orientation: 'landscape',
  widthPx: 1056,
  heightPx: 816
};

const LEGAL_PORTRAIT: VisualReportPaper = {
  format: 'legal',
  orientation: 'portrait',
  widthPx: 816,
  heightPx: 1344
};

const CAPTURE_SCALE = 2;

export function visualReportPaper(rendererKey: string): VisualReportPaper {
  if (rendererKey === 'VisualLoanArrears' || rendererKey === 'VisualAuxLedger') {
    return LETTER_LANDSCAPE;
  }
  if (rendererKey === 'VisualBranchVoucher') {
    return LEGAL_PORTRAIT;
  }
  return LETTER_PORTRAIT;
}

export function visualReportPdfFilename(reportName: string): string {
  const slug = reportName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'reporte'}.pdf`;
}

export function visualReportPageSlices(contentHeightPx: number, pageHeightPx: number): VisualReportPageSlice[] {
  if (contentHeightPx <= 0 || pageHeightPx <= 0) {
    return [];
  }
  const slices: VisualReportPageSlice[] = [];
  let y = 0;
  while (y < contentHeightPx) {
    const height = Math.min(pageHeightPx, contentHeightPx - y);
    slices.push({ y, height });
    y += height;
  }
  return slices;
}

export async function downloadVisualReportPdf(
  canvas: HTMLElement,
  rendererKey: string,
  reportName: string
): Promise<void> {
  const paper = visualReportPaper(rendererKey);
  const articles = Array.from(canvas.querySelectorAll('article')).filter(
    (article): article is HTMLElement => article instanceof HTMLElement
  );
  const targets = articles.length > 1 ? articles : [documentElement(canvas, articles)];
  const { default: html2canvas } = await import('html2canvas');
  const orientation = paper.orientation === 'landscape' ? 'l' : 'p';
  const pdf = new jsPDF({
    orientation,
    unit: 'in',
    format: paper.format,
    compress: true
  });

  let placedPage = false;
  for (const target of targets) {
    await waitForImages(target);
    const bitmap = await html2canvas(target, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const slices = visualReportPageSlices(bitmap.height / CAPTURE_SCALE, paper.heightPx);
    for (const slice of slices) {
      if (placedPage) {
        pdf.addPage(paper.format, orientation);
      }
      placedPage = true;
      const sliceCanvas = cropCanvas(bitmap, slice.y * CAPTURE_SCALE, slice.height * CAPTURE_SCALE);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (slice.height / paper.heightPx) * pageHeight;
      pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageWidth, imageHeight);
    }
  }

  if (!placedPage) {
    throw new Error('No se pudo generar el PDF.');
  }

  pdf.save(visualReportPdfFilename(reportName));
}

function documentElement(canvas: HTMLElement, articles: HTMLElement[]): HTMLElement {
  return articles[0] ?? (canvas.firstElementChild instanceof HTMLElement ? canvas.firstElementChild : canvas);
}

function cropCanvas(source: HTMLCanvasElement, y: number, height: number): HTMLCanvasElement {
  const start = Math.max(0, Math.min(source.height - 1, Math.round(y)));
  const sliceHeight = Math.max(1, Math.min(Math.round(height), source.height - start));
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = sliceHeight;
  const context = slice.getContext('2d');
  if (!context) {
    throw new Error('No se pudo generar el PDF.');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(source, 0, start, source.width, sliceHeight, 0, 0, source.width, sliceHeight);
  return slice;
}

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );
}
