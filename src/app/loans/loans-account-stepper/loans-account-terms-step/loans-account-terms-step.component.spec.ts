import { FormBuilder } from '@angular/forms';
import { LoansAccountTermsStepComponent } from './loans-account-terms-step.component';

describe('LoansAccountTermsStepComponent refinancing', () => {
  let component: LoansAccountTermsStepComponent;

  beforeEach(() => {
    component = new LoansAccountTermsStepComponent(
      new FormBuilder(),
      {} as any,
      { snapshot: { params: {} } } as any,
      {} as any,
      {} as any
    );
  });

  it('maps a single-loan refinance to the compatible API fields', () => {
    component.loansAccountTermsForm.patchValue({
      refinancingMode: 'SINGLE_REFINANCE',
      loanIdToClose: 17
    });

    const payload = component.loansAccountTerms;

    expect(payload.isTopup).toBe(true);
    expect(payload.loanIdToClose).toBe(17);
    expect(payload.loanIdsToClose).toEqual([17]);
    expect(payload.refinancingMode).toBeUndefined();
  });

  it('requires and emits at least two loans for consolidation', () => {
    component.loansAccountTermsForm.patchValue({ refinancingMode: 'CONSOLIDATION' });
    component.loansAccountTermsForm.get('loanIdsToClose').setValue([17]);
    expect(component.loansAccountTermsForm.get('loanIdsToClose').valid).toBe(false);

    component.loansAccountTermsForm.get('loanIdsToClose').setValue([
      17,
      23
    ]);
    const payload = component.loansAccountTerms;

    expect(component.loansAccountTermsForm.get('loanIdsToClose').valid).toBe(true);
    expect(payload.isTopup).toBe(true);
    expect(payload.loanIdToClose).toBeUndefined();
    expect(payload.loanIdsToClose).toEqual([
      17,
      23
    ]);
  });

  it('removes refinancing identifiers for a standard loan', () => {
    component.loansAccountTermsForm.patchValue({ refinancingMode: 'NONE' });

    const payload = component.loansAccountTerms;

    expect(payload.isTopup).toBe(false);
    expect(payload.loanIdToClose).toBeUndefined();
    expect(payload.loanIdsToClose).toBeUndefined();
  });
});
