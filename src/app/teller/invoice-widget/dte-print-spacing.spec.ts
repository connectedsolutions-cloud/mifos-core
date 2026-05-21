import {
  DTE_PRINT_SPACE,
  dteFieldRowAdvanceIn,
  dteLineAdvanceIn,
  dtePx,
  dtePt,
  dteYAfterSectionTitle
} from './dte-print-spacing';

describe('dte-print-spacing', () => {
  it('converts 96px to 1 inch', () => {
    expect(dtePx(96)).toBeCloseTo(1, 5);
  });

  it('converts 11px font to 8.25pt', () => {
    expect(dtePt(11)).toBeCloseTo(8.25, 5);
  });

  it('maps header margin-bottom to 12px', () => {
    expect(DTE_PRINT_SPACE.headerMarginBottom).toBeCloseTo(dtePx(12), 5);
  });

  it('field row advance includes 4px gap', () => {
    const line = dteLineAdvanceIn(11);
    expect(dteFieldRowAdvanceIn(11, 1)).toBeCloseTo(line + dtePx(4), 5);
  });

  it('section title advance includes 6px margin-bottom', () => {
    expect(dteYAfterSectionTitle(1)).toBeCloseTo(1 + dteLineAdvanceIn(11) + dtePx(6), 5);
  });
});
