import {
  INFORME_AUXILIAR_MAYOR_PRINT_PAGE,
  InformeAuxiliarMayorReportComponent
} from './informe-auxiliar-mayor-report.component';

describe('InformeAuxiliarMayorReportComponent', () => {
  it('formats negative balances with accounting parentheses', () => {
    const component = new InformeAuxiliarMayorReportComponent();

    expect(component.money(-198.03)).toBe('($198.03)');
    expect(component.money(0)).toBe('$0.00');
  });

  it('declares the legacy Letter landscape print format', () => {
    expect(INFORME_AUXILIAR_MAYOR_PRINT_PAGE).toBe('letter landscape');
  });
});
