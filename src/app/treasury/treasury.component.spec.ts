import { of } from 'rxjs';
import { TreasuryComponent } from './treasury.component';

describe('Treasury historical cheque lookup', () => {
  const service = { getHistoricalCheques: jest.fn() };
  const component = new TreasuryComponent(service as any, {} as any, {} as any);

  beforeEach(() => {
    service.getHistoricalCheques.mockReset();
  });

  it('loads cheque facts through the selected filters', () => {
    const rows = [{ kind: 'received', chequeNumber: 'CH-007', links: [{ relationship: 'LOAN_MOVEMENT' }] }];
    service.getHistoricalCheques.mockReturnValue(of(rows));
    component.chequeFilters.number = 'CH-007';
    component.chequeFilters.exact = 'true';

    component.loadHistoricalCheques();

    expect(service.getHistoricalCheques).toHaveBeenCalledWith(
      expect.objectContaining({ number: 'CH-007', exact: 'true' })
    );
    expect(component.historicalCheques).toEqual(rows);
  });

  it('navigates only when an exact native target was resolved', () => {
    expect(component.linkRoute({ relationship: 'LOAN_MOVEMENT' })).toBeNull();
    expect(component.linkRoute({ targetType: 'loan_transaction', targetId: '2|3|4' })).toEqual([
      '/clients',
      '2',
      'loans-accounts',
      '3',
      'transactions',
      '4'
    ]);
    expect(component.linkRoute({ targetType: 'savings_transaction', targetId: '2|5|6' })).toEqual([
      '/clients',
      '2',
      'savings-accounts',
      '5',
      'transactions',
      '6'
    ]);
    expect(component.linkRoute({ targetType: 'gl_journal', targetId: 'journal-7' })).toEqual([
      '/accounting/journal-entries/transactions/view',
      'journal-7'
    ]);
  });
});
