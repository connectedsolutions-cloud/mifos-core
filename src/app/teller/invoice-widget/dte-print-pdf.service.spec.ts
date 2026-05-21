import { buildMhConsultaUrl, fitLogoDimensions, mapTipoDteToTitle } from './dte-print-pdf.service';

describe('DtePrintPdfService helpers', () => {
  it('mapTipoDteToTitle maps known codes', () => {
    expect(mapTipoDteToTitle('01')).toBe('FACTURA CONSUMIDOR FINAL');
    expect(mapTipoDteToTitle('03')).toBe('COMPROBANTE DE CRÉDITO FISCAL');
  });

  it('mapTipoDteToTitle falls back for unknown codes', () => {
    expect(mapTipoDteToTitle('99')).toBe('TIPO DTE 99');
  });

  it('buildMhConsultaUrl uses test portal for ambiente 00', () => {
    const url = buildMhConsultaUrl({
      ambiente: '00',
      codigoGeneracion: '11111111-2222-4333-8444-555555555555',
      fecEmi: '2026-05-21'
    });
    expect(url).toContain('https://test7.mh.gob.sv/ssc/consulta/fe');
    expect(url).toContain('codigoGeneracion=11111111-2222-4333-8444-555555555555');
    expect(url).toContain('fechaEmi=2026-05-21');
  });

  it('buildMhConsultaUrl uses production portal for ambiente 01', () => {
    const url = buildMhConsultaUrl({
      ambiente: '01',
      codigoGeneracion: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    });
    expect(url).toContain('https://portaldgii.mh.gob.sv/ssc/consulta/fe');
  });

  it('fitLogoDimensions preserves aspect ratio for wide logos', () => {
    const { width, height } = fitLogoDimensions(500, 256, 0.55);
    expect(width).toBeCloseTo(0.55, 5);
    expect(height).toBeCloseTo(0.55 * (256 / 500), 5);
    expect(width / height).toBeCloseTo(500 / 256, 5);
  });

  it('fitLogoDimensions preserves aspect ratio for tall logos', () => {
    const { width, height } = fitLogoDimensions(256, 500, 0.55);
    expect(height).toBeCloseTo(0.55, 5);
    expect(width).toBeCloseTo(0.55 * (256 / 500), 5);
  });
});
