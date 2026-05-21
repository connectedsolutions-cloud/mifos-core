import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { InvoiceWidgetComponent } from './invoice-widget.component';

describe('InvoiceWidgetComponent', () => {
  const dialogData = {
    transactionId: 10,
    entityType: 'loans' as const,
    transactionNote: 'Client:99-Test User',
    currencyCode: 'USD',
    loanId: 42
  };

  const buildComponent = (overrides?: {
    getInvoiceByTransaction?: any;
    getClientData?: any;
    getClientDatatable?: any;
    getLoanAccountResource?: any;
    previewMhDteItemComponent?: any;
    entityType?: 'loans' | 'savings' | 'client';
    loanId?: number;
  }) => {
    const organizationService = {
      getInvoiceByTransaction: jest.fn(() => of(overrides?.getInvoiceByTransaction ?? null)),
      createInvoiceDraft: jest.fn(() => of({ id: 88 })),
      updateInvoiceMetadata: jest.fn(() => of({ id: 88 })),
      validateInvoiceById: jest.fn(() => of({ id: 88 }))
    } as any;

    const clientsService = {
      getClientData: jest.fn(() =>
        of(
          overrides?.getClientData ?? {
            displayName: 'Fallback Name',
            externalId: 'EXT-123',
            emailAddress: 'client@test.com',
            mobileNo: '70001234',
            clientType: { name: 'Individual' }
          }
        )
      ),
      getClientDatatable: jest.fn(() => of(overrides?.getClientDatatable ?? null))
    } as any;

    const productsService = {
      previewMhDteItemComponent: jest.fn(() =>
        of(
          overrides?.previewMhDteItemComponent ?? {
            lines: [
              {
                mappingName: 'Principal',
                source: 'PRINCIPAL',
                amount: 100,
                dteAmountType: 'ventaGravada'
              },
              {
                mappingName: 'Interest',
                source: 'INTEREST',
                amount: 25,
                dteAmountType: 'ventaExenta'
              }
            ],
            warnings: []
          }
        )
      )
    } as any;

    const loansService = {
      getLoanAccountResource: jest.fn(() =>
        of(
          overrides?.getLoanAccountResource ?? {
            loanProductName: 'Microcredit',
            externalId: 'CRED-001'
          }
        )
      )
    } as any;

    const dialogRef = { close: jest.fn() } as any;
    const snackBar = { open: jest.fn() } as any;
    const dtePrintPdfService = { buildAndPrint: jest.fn(() => Promise.resolve()) } as any;
    const router = {
      createUrlTree: jest.fn(() => ({})),
      serializeUrl: jest.fn(() => '/dte-preview?loanTransactionId=10')
    } as any;
    const location = {
      prepareExternalUrl: jest.fn((path: string) => `#${path}`)
    } as any;
    const data = {
      ...dialogData,
      entityType: overrides?.entityType ?? dialogData.entityType,
      loanId: overrides?.loanId !== undefined ? overrides.loanId : dialogData.loanId
    };
    const component = new InvoiceWidgetComponent(
      data,
      dialogRef,
      new FormBuilder(),
      organizationService,
      clientsService,
      productsService,
      loansService,
      snackBar,
      dtePrintPdfService,
      router,
      location
    );
    return {
      component,
      organizationService,
      clientsService,
      productsService,
      loansService,
      dtePrintPdfService,
      router,
      location
    };
  };

  it('defaults receptor tipoDocumento to 13 when datatable has no value', () => {
    const { component } = buildComponent();

    component.ngOnInit();

    expect(component.form.get('receptorTipoDocumento')?.value).toBe('13');
  });

  it('prefills receptor data from client datatable when available', () => {
    const datatablePayload = {
      columnHeaders: [
        { columnName: 'tipo_documento_identificacion' },
        { columnName: 'numero_documento_identificacion' },
        { columnName: 'cod_actividad_economica' },
        { columnName: 'desc_actividad_economica' },
        { columnName: 'departamento' },
        { columnName: 'municipio' },
        { columnName: 'direccion_domicilio' }],
      data: [{ row: [
            'DUI',
            '01234567-8',
            '62010',
            'Servicios',
            '06',
            '14',
            'Centro'
          ] }]
    };
    const { component } = buildComponent({ getClientDatatable: datatablePayload });

    component.ngOnInit();

    expect(component.form.get('receptorTipoDocumento')?.value).toBe('13');
    expect(component.form.get('receptorDocId')?.value).toBe('01234567-8');
    expect(component.form.get('receptorCodActividad')?.value).toBe('62010');
    expect(component.form.get('receptorDireccionDepartamento')?.value).toBe('06');
  });

  it('sends extended receptor fields in metadata update payload', () => {
    const existingInvoice = { id: 55, status: 'DRAFT' };
    const { component, organizationService } = buildComponent({ getInvoiceByTransaction: existingInvoice });
    component.ngOnInit();

    component.form.patchValue({
      receptorTipoDocumento: '13',
      receptorNombre: 'Cliente Test',
      receptorDocId: '01234567-8',
      receptorNit: '06141212001014',
      receptorNrc: '1234567',
      receptorCodActividad: '62010',
      receptorDescActividad: 'Servicios',
      receptorNombreComercial: 'Comercial',
      receptorDireccionDepartamento: '06',
      receptorDireccionMunicipio: '14',
      receptorDireccionComplemento: 'Centro',
      receptorCorreo: 'client@test.com',
      receptorTelefono: '70001234'
    });

    component.saveAndValidate();

    expect(organizationService.updateInvoiceMetadata).toHaveBeenCalledWith(
      55,
      expect.objectContaining({
        receptorTipoDocumento: '13',
        receptorCodActividad: '62010',
        receptorDescActividad: 'Servicios',
        receptorDireccionDepartamento: '06',
        receptorDireccionMunicipio: '14',
        receptorDireccionComplemento: 'Centro'
      })
    );
  });

  it('loads loan details and line preview for loan transactions', () => {
    const { component, productsService, loansService } = buildComponent();

    component.ngOnInit();

    expect(loansService.getLoanAccountResource).toHaveBeenCalledWith('42', '');
    expect(productsService.previewMhDteItemComponent).toHaveBeenCalledWith(10, 'Individual', false);
    expect(component.lineaCrediticiaDisplay).toBe('Microcredit');
    expect(component.numeroCreditoDisplay).toBe('CRED-001');
    expect(component.lineItems.length).toBe(2);
  });

  it('does not load line preview for savings transactions', () => {
    const { component, productsService } = buildComponent({ entityType: 'savings', loanId: undefined });

    component.ngOnInit();

    expect(productsService.previewMhDteItemComponent).not.toHaveBeenCalled();
    expect(component.isLoanTransaction).toBe(false);
  });

  describe('mapPreviewLineToRow', () => {
    it('maps ventaGravada to taxable column only', () => {
      const row = InvoiceWidgetComponent.mapPreviewLineToRow({
        mappingName: 'Principal',
        amount: 50,
        dteAmountType: 'ventaGravada'
      });
      expect(row.precioUni).toBe(50);
      expect(row.ventaGravada).toBe(50);
      expect(row.ventaExenta).toBe(0);
      expect(row.ventaNoSuj).toBe(0);
      expect(row.noGravado).toBe(0);
      expect(row.cantidad).toBe(1);
    });

    it('maps ventaExenta to exempt column only', () => {
      const row = InvoiceWidgetComponent.mapPreviewLineToRow({
        mappingName: 'Interest',
        amount: 12.5,
        dteAmountType: 'ventaExenta'
      });
      expect(row.ventaExenta).toBe(12.5);
      expect(row.ventaGravada).toBe(0);
    });

    it('maps noGravado and psv to non-taxable column', () => {
      expect(InvoiceWidgetComponent.mapPreviewLineToRow({ amount: 1, dteAmountType: 'noGravado' }).noGravado).toBe(1);
      expect(InvoiceWidgetComponent.mapPreviewLineToRow({ amount: 2, dteAmountType: 'psv' }).noGravado).toBe(2);
    });

    it('uses source as description fallback', () => {
      const row = InvoiceWidgetComponent.mapPreviewLineToRow({
        source: 'CHARGE:5',
        amount: 3,
        dteAmountType: 'ventaNoSuj'
      });
      expect(row.descripcion).toBe('CHARGE:5');
      expect(row.ventaNoSuj).toBe(3);
    });
  });

  it('sets readonlyMode when invoice is validated', () => {
    const { component } = buildComponent({
      getInvoiceByTransaction: { id: 5, status: 'ACCEPTED', mhValidationStatus: 'SUCCESS' }
    });
    component.ngOnInit();
    expect(component.readonlyMode).toBe(true);
  });

  it('printDte refetches invoice and calls pdf service', async () => {
    const invoice = { id: 5, status: 'ACCEPTED', tipoDte: '03', codigoGeneracion: 'uuid' };
    const { component, organizationService, dtePrintPdfService } = buildComponent({
      getInvoiceByTransaction: invoice
    });
    component.invoice = { id: 5 };
    component.readonlyMode = true;
    component.loanAccount = { loanProductName: 'Microcredit', externalId: 'CRED-001' };

    component.printDte();
    await Promise.resolve();

    expect(organizationService.getInvoiceByTransaction).toHaveBeenCalledWith('loans', 10);
    await Promise.resolve();
    expect(dtePrintPdfService.buildAndPrint).toHaveBeenCalledWith(
      expect.objectContaining({
        currencyCode: 'USD',
        receptor: expect.arrayContaining([
          expect.objectContaining({ label: 'Línea crediticia', value: 'Microcredit' }),
          expect.objectContaining({ label: 'No. crédito', value: 'CRED-001', column: 2 })
        ])
      })
    );
  });

  describe('formatEmissionDate', () => {
    it('returns today when fecEmi is missing', () => {
      const { component } = buildComponent();
      const today = new Date().toISOString().slice(0, 10);
      expect(component.formatEmissionDate()).toBe(today);
    });

    it('parses ISO date strings', () => {
      const { component } = buildComponent();
      expect(component.formatEmissionDate('2026-05-20')).toBe('2026-05-20');
    });
  });
});
