import {
  mapPreviewLineToRow,
  mapPreviewLinesToInvoiceLines,
  resolveInvoiceLinesForPrint,
  summarizeDtePrintLines
} from './dte-line-preview.mapper';

describe('dte-line-preview.mapper', () => {
  it('maps ventaGravada to taxable column only', () => {
    const row = mapPreviewLineToRow({
      mappingName: 'Principal',
      amount: 50,
      dteAmountType: 'ventaGravada'
    });
    expect(row.ventaGravada).toBe(50);
    expect(row.ventaExenta).toBe(0);
    expect(row.precioUni).toBe(50);
  });

  it('maps preview lines to invoice line shape', () => {
    const lines = mapPreviewLinesToInvoiceLines([
      { mappingName: 'Cuota capital', amount: 100, dteAmountType: 'ventaGravada' },
      { mappingName: 'Interés', amount: 25, dteAmountType: 'ventaExenta' }
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0].numItem).toBe(1);
    expect(lines[0].descripcion).toBe('Cuota capital');
    expect(lines[1].ventaExenta).toBe(25);
  });

  it('prefers preview lines over stored placeholder for loans', () => {
    const resolved = resolveInvoiceLinesForPrint(
      {
        lines: [
          {
            numItem: 1,
            descripcion: 'SERVICIO FINANCIERO',
            cantidad: 1,
            precioUni: 0,
            ventaGravada: 0,
            ventaExenta: 0,
            ventaNoSuj: 0,
            noGravado: 0
          }
        ]
      },
      {
        lines: [{ mappingName: 'Principal', amount: 50, dteAmountType: 'ventaGravada' }]
      },
      true
    );
    expect(resolved[0].descripcion).toBe('Principal');
    expect(resolved[0].ventaGravada).toBe(50);
  });

  it('falls back to invoice lines when preview is empty', () => {
    const stored = [{ numItem: 1, descripcion: 'Stored line', cantidad: 1, precioUni: 10, ventaGravada: 10 }];
    const resolved = resolveInvoiceLinesForPrint({ lines: stored }, { lines: [] }, true);
    expect(resolved).toEqual(stored);
  });

  it('sums each column and total a pagar across all categories', () => {
    const totals = summarizeDtePrintLines([
      {
        numItem: 1,
        descripcion: 'A',
        cantidad: 1,
        precioUni: 50,
        ventaGravada: 50,
        ventaExenta: 0,
        ventaNoSuj: 0,
        noGravado: 0
      },
      {
        numItem: 2,
        descripcion: 'B',
        cantidad: 1,
        precioUni: 12.5,
        ventaGravada: 0,
        ventaExenta: 12.5,
        ventaNoSuj: 0,
        noGravado: 0
      },
      {
        numItem: 3,
        descripcion: 'C',
        cantidad: 1,
        precioUni: 3,
        ventaGravada: 0,
        ventaExenta: 0,
        ventaNoSuj: 2,
        noGravado: 1
      }
    ]);
    expect(totals.totalGravada).toBe(50);
    expect(totals.totalExenta).toBe(12.5);
    expect(totals.totalNoSuj).toBe(2);
    expect(totals.totalNoGravado).toBe(1);
    expect(totals.subTotal).toBe(65.5);
    expect(totals.totalPagar).toBe(65.5);
  });
});
