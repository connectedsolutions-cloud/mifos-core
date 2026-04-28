import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { InvoiceWidgetComponent } from './invoice-widget.component';

describe('InvoiceWidgetComponent', () => {
  const dialogData = {
    transactionId: 10,
    entityType: 'loans' as const,
    transactionNote: 'Client:99-Test User',
    currencyCode: 'USD'
  };

  const buildComponent = (overrides?: {
    getInvoiceByTransaction?: any;
    getClientData?: any;
    getClientDatatable?: any;
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
            mobileNo: '70001234'
          }
        )
      ),
      getClientDatatable: jest.fn(() => of(overrides?.getClientDatatable ?? null))
    } as any;

    const dialogRef = { close: jest.fn() } as any;
    const snackBar = { open: jest.fn() } as any;
    const component = new InvoiceWidgetComponent(
      dialogData,
      dialogRef,
      new FormBuilder(),
      organizationService,
      clientsService,
      snackBar
    );
    return { component, organizationService, clientsService };
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
});
