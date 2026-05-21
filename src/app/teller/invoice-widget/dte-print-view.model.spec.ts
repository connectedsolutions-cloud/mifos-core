import { buildDtePrintViewModel, buildSampleDtePrintInvoice } from './dte-print-view.model';

describe('buildDtePrintViewModel', () => {
  it('builds view model from sample invoice', () => {
    const vm = buildDtePrintViewModel(buildSampleDtePrintInvoice(), 'USD');
    expect(vm.documentTitle).toBe('COMPROBANTE DE CRÉDITO FISCAL');
    expect(vm.lines.length).toBe(2);
    expect(vm.qrUrl).toContain('codigoGeneracion=');
    const linea = vm.receptor.find((row) => row.label === 'Línea crediticia');
    const numero = vm.receptor.find((row) => row.label === 'No. crédito');
    expect(linea?.value).toBe('Microcrédito Empresarial');
    expect(numero?.value).toBe('CRED-SAMPLE-001');
    expect(numero?.column).toBe(2);
    const gravada = vm.totals.find((row) => row.label === 'Total gravada');
    const pagar = vm.totals.find((row) => row.label === 'Total a pagar');
    expect(gravada?.value).toContain('100.00');
    expect(pagar?.value).toContain('125.00');
  });

  it('computes RESUMEN from lines when stored invoice totals are zero', () => {
    const vm = buildDtePrintViewModel(
      {
        tipoDte: '03',
        totalGravada: 0,
        totalExenta: 0,
        totalNoSuj: 0,
        subTotal: 0,
        montoTotalOperacion: 0,
        totalPagar: 0,
        lines: [
          {
            numItem: 1,
            descripcion: 'Principal',
            cantidad: 1,
            precioUni: 80,
            ventaGravada: 80,
            ventaExenta: 0,
            ventaNoSuj: 0,
            noGravado: 0
          },
          {
            numItem: 2,
            descripcion: 'Interés',
            cantidad: 1,
            precioUni: 20,
            ventaGravada: 0,
            ventaExenta: 20,
            ventaNoSuj: 0,
            noGravado: 0
          }
        ]
      },
      'USD'
    );
    expect(vm.totals.find((row) => row.label === 'Total gravada')?.value).toContain('80.00');
    expect(vm.totals.find((row) => row.label === 'Total exenta')?.value).toContain('20.00');
    expect(vm.totals.find((row) => row.label === 'Total a pagar')?.value).toContain('100.00');
  });
});
