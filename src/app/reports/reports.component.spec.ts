import { of } from 'rxjs';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent saved reports', () => {
  const reports = [
    { id: 1, reportName: 'Allowed', reportCategory: 'Accounting', useReport: true },
    { id: 2, reportName: 'Restricted', reportCategory: 'Accounting', useReport: true },
    { id: 3, reportName: 'Inactive', reportCategory: 'Accounting', useReport: false },
    { id: 4, reportName: 'Another', reportCategory: 'Loan', useReport: true },
    { id: 5, reportName: 'Movimientos de Partidas', reportCategory: 'Accounting', useReport: true }
  ];

  function createComponent(filter: string, confirm = true, permissions = [
      'READ_Allowed',
      'READ_Another'
    ]) {
    const route = { data: of({ reports }), snapshot: { params: { filter } } } as any;
    const router = { routeReuseStrategy: { shouldReuseRoute: () => true } } as any;
    const translate = {
      instant: (key: string, params?: { name?: string }) => (params?.name ? `${key}:${params.name}` : key)
    } as any;
    const authentication = {
      getCredentials: () => ({ permissions })
    } as any;
    const reportService = {
      getSavedReportIds: jest.fn(() => of([1])),
      saveReport: jest.fn(() => of(undefined)),
      removeSavedReport: jest.fn(() => of(undefined))
    } as any;
    const dialog = {
      open: jest.fn(() => ({ afterClosed: () => of(confirm ? { confirm: true } : undefined) }))
    } as any;
    const component = new ReportsComponent(route, router, translate, authentication, reportService, dialog);
    component.ngOnInit();
    return { component, reportService, dialog };
  }

  it('shows only authorized, active reports in their category', () => {
    const { component } = createComponent('Accounting');

    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([1]);
  });

  it('shows Movimientos de Partidas in Accounting for an ALL_FUNCTIONS operator', () => {
    const { component } = createComponent('Accounting', true, ['ALL_FUNCTIONS']);
    expect(component.dataSource.filteredData.map((report) => report.reportName)).toContain('Movimientos de Partidas');
  });

  it('keeps search within the selected category and searches report fields', () => {
    const { component } = createComponent('Accounting');

    component.applyFilter('Accounting');

    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([1]);
    component.applyFilter('Loan');
    expect(component.dataSource.filteredData).toEqual([]);
  });

  it('shows the current user’s saved reports and removes them after confirmation', () => {
    const { component, reportService, dialog } = createComponent('saved');
    const event = { stopPropagation: jest.fn() } as any;

    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([1]);
    component.toggleSaved(event, reports[0]);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({
          heading: 'savedReports.removeHeading',
          dialogContext: 'savedReports.removeConfirm:Allowed'
        })
      })
    );
    expect(reportService.removeSavedReport).toHaveBeenCalledWith(1);
    expect(component.dataSource.filteredData).toEqual([]);
  });

  it('keeps a saved report when removal is cancelled', () => {
    const { component, reportService } = createComponent('saved', false);

    component.toggleSaved({ stopPropagation: jest.fn() } as any, reports[0]);

    expect(reportService.removeSavedReport).not.toHaveBeenCalled();
    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([1]);
  });

  it('saves a visible report without moving it from its original category', () => {
    const { component, reportService } = createComponent('Loan');
    const event = { stopPropagation: jest.fn() } as any;

    component.toggleSaved(event, reports[3]);

    expect(reportService.saveReport).toHaveBeenCalledWith(4);
    expect(component.savedReportIds.has(4)).toBe(true);
    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([4]);
  });
});
