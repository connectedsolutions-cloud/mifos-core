import {
  VISUAL_AUXILIARY_LEDGER_RENDERER,
  VISUAL_BRANCH_VOUCHER_RENDERER,
  VISUAL_DAILY_MOVEMENT_RENDERER,
  VISUAL_LOAN_ARREARS_RENDERER,
  VISUAL_VOUCHER_RENDERER
} from './visual-report.component';
import { visualReportPageSlices, visualReportPaper, visualReportPdfFilename } from './visual-report-pdf';

describe('visual report PDF', () => {
  it('uses letter landscape for loan arrears and the auxiliary ledger', () => {
    expect(visualReportPaper(VISUAL_LOAN_ARREARS_RENDERER)).toEqual({
      format: 'letter',
      orientation: 'landscape',
      widthPx: 1056,
      heightPx: 816
    });
    expect(visualReportPaper(VISUAL_AUXILIARY_LEDGER_RENDERER).orientation).toBe('landscape');
  });

  it('uses legal portrait for the branch voucher', () => {
    expect(visualReportPaper(VISUAL_BRANCH_VOUCHER_RENDERER)).toEqual({
      format: 'legal',
      orientation: 'portrait',
      widthPx: 816,
      heightPx: 1344
    });
  });

  it('uses letter portrait for the remaining visual reports', () => {
    expect(visualReportPaper(VISUAL_VOUCHER_RENDERER)).toEqual({
      format: 'letter',
      orientation: 'portrait',
      widthPx: 816,
      heightPx: 1056
    });
    expect(visualReportPaper(VISUAL_DAILY_MOVEMENT_RENDERER).format).toBe('letter');
    expect(visualReportPaper('')).toEqual(visualReportPaper(VISUAL_VOUCHER_RENDERER));
  });

  it('slugs the report name into a PDF filename', () => {
    expect(visualReportPdfFilename('Detalle de Saldos de Préstamos y Morosidad')).toBe(
      'detalle-de-saldos-de-prestamos-y-morosidad.pdf'
    );
    expect(visualReportPdfFilename('   ')).toBe('reporte.pdf');
  });

  it('splits a tall canvas into full pages plus a remainder', () => {
    expect(visualReportPageSlices(2500, 1056)).toEqual([
      { y: 0, height: 1056 },
      { y: 1056, height: 1056 },
      { y: 2112, height: 388 }
    ]);
    expect(visualReportPageSlices(816, 816)).toEqual([{ y: 0, height: 816 }]);
    expect(visualReportPageSlices(0, 1056)).toEqual([]);
  });
});
