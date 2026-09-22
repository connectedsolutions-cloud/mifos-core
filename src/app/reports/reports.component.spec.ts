import { of } from 'rxjs';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent saved reports', () => {
  const reports = [
    { id: 1, reportName: 'Allowed', reportCategory: 'Accounting', useReport: true },
    { id: 2, reportName: 'Restricted', reportCategory: 'Accounting', useReport: true },
    { id: 3, reportName: 'Inactive', reportCategory: 'Accounting', useReport: false },
    { id: 4, reportName: 'Another', reportCategory: 'Loan', useReport: true }
  ];

  function createComponent(filter: string) {
    const route = { data: of({ reports }), snapshot: { params: { filter } } } as any;
    const router = { routeReuseStrategy: { shouldReuseRoute: () => true } } as any;
    const translate = { instant: (key: string) => key } as any;
    const authentication = {
      getCredentials: () => ({ permissions: [
          'READ_Allowed',
          'READ_Another'
        ] })
    } as any;
    const reportService = {
      getSavedReportIds: jest.fn(() => of([1])),
      saveReport: jest.fn(() => of(undefined)),
      removeSavedReport: jest.fn(() => of(undefined))
    } as any;
    const component = new ReportsComponent(route, router, translate, authentication, reportService);
    component.ngOnInit();
    return { component, reportService };
  }

  it('shows only authorized, active reports in their category', () => {
    const { component } = createComponent('Accounting');

    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([1]);
  });

  it('keeps search within the selected category and searches report fields', () => {
    const { component } = createComponent('Accounting');

    component.applyFilter('Accounting');

    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([1]);
    component.applyFilter('Loan');
    expect(component.dataSource.filteredData).toEqual([]);
  });

  it('shows the current user’s saved reports and removes them with the star', () => {
    const { component, reportService } = createComponent('saved');
    const event = { stopPropagation: jest.fn() } as any;

    expect(component.dataSource.filteredData.map((report) => report.id)).toEqual([1]);
    component.toggleSaved(event, reports[0]);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(reportService.removeSavedReport).toHaveBeenCalledWith(1);
    expect(component.dataSource.filteredData).toEqual([]);
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
