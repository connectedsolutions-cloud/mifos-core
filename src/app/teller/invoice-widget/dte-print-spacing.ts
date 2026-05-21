/**
 * Layout tokens for DTE print (HTML + PDF). Keep in sync with
 * `dte-print-document.component.scss` (96 CSS px per inch).
 */
export const DTE_PX_PER_IN = 96;

/** CSS px → inches (jsPDF coordinates when unit is `in`). */
export function dtePx(px: number): number {
  return px / DTE_PX_PER_IN;
}

/** CSS px → points (jsPDF `setFontSize`). */
export function dtePt(cssPx: number): number {
  return (cssPx * 72) / DTE_PX_PER_IN;
}

/** Matches `.dte-print-page` line-height. */
export const DTE_PRINT_LINE_HEIGHT = 1.35;

export const DTE_PRINT_LAYOUT = {
  pagePaddingIn: 0.55,
  logoBoxIn: dtePx(52),
  headerRightIn: dtePx(370),
  headerGapIn: dtePx(16),
  idLabelColIn: dtePx(128),
  fieldLabelColIn: dtePx(140),
  receptorFieldLabelColIn: dtePx(108),
  totalsWidthIn: dtePx(320),
  qrMaxIn: dtePx(88),
  brandLogoTextGapIn: dtePx(12)
} as const;

/** Vertical gaps / margins from SCSS (px → in). */
export const DTE_PRINT_SPACE = {
  headerMarginBottom: dtePx(12),
  brandPaddingBottom: dtePx(10),
  brandTaglineMarginTop: dtePx(4),
  docTypePaddingY: dtePx(10),
  docTypeIdentificationGap: dtePx(8),
  docTypeTitleMarginTop: dtePx(6),
  qrMarginTop: dtePx(10),
  qrCaptionMarginTop: dtePx(6),
  qrUrlMarginTop: dtePx(4),
  sectionMarginBottom: dtePx(14),
  sectionTitleMarginBottom: dtePx(6),
  fieldsRowGap: dtePx(4),
  receptorFieldsColumnGap: dtePx(16),
  receptorPaddingTop: dtePx(12),
  totalLetrasMarginTop: dtePx(10),
  totalRowPaddingY: dtePx(2),
  tableCellPaddingY: dtePx(4),
  tableCellPaddingX: dtePx(6)
} as const;

/** Font sizes from SCSS (px → pt). */
export const DTE_PRINT_FONT = {
  base: dtePt(11),
  sectionTitle: dtePt(11),
  brandName: dtePt(28),
  brandTagline: dtePt(11),
  docTypeLabel: dtePt(9),
  docTypeTitle: dtePt(11),
  qrCaption: dtePt(10),
  qrUrl: dtePt(8),
  table: dtePt(10),
  totalLetras: dtePt(10)
} as const;

/** Text block height for a CSS font-size and line count. */
export function dteLineAdvanceIn(cssFontPx: number, lineCount = 1): number {
  return (cssFontPx * DTE_PRINT_LINE_HEIGHT * lineCount) / DTE_PX_PER_IN;
}

/** Grid/inline field row: line box + `.dte-print-fields` gap (4px). */
export function dteFieldRowAdvanceIn(cssFontPx: number, lineCount: number): number {
  return dteLineAdvanceIn(cssFontPx, lineCount) + DTE_PRINT_SPACE.fieldsRowGap;
}

/** Y for first field row after a section title (title line box + margin-bottom). */
export function dteYAfterSectionTitle(titleBaselineY: number, titleFontPx = 11): number {
  return titleBaselineY + dteLineAdvanceIn(titleFontPx) + DTE_PRINT_SPACE.sectionTitleMarginBottom;
}

/** Total row: line box + `.dte-print-total-row` vertical padding (2px × 2). */
export function dteTotalRowAdvanceIn(): number {
  return dteLineAdvanceIn(11) + DTE_PRINT_SPACE.totalRowPaddingY * 2;
}
