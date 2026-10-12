import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Dates } from 'app/core/utils/dates';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { LoansService } from 'app/loans/loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { LoanDelinquencyTagsTabComponent } from './loan-delinquency-tags-tab.component';

describe('Loan delinquency tag history', () => {
  it('shows a stored E category without implying its configured day threshold was the historical DPD', async () => {
    const route = {
      parent: {
        parent: { snapshot: { params: { loanId: '42' } } },
        data: of({
          loanDelinquencyTagsData: [
            { delinquencyRange: { classification: 'E', minimumAgeDays: 181, maximumAgeDays: null } }],
          loanDelinquencyActions: [],
          loanDelinquencyData: { delinquent: null, currency: { code: 'USD' } }
        })
      }
    } as unknown as ActivatedRoute;
    await TestBed.configureTestingModule({
      imports: [
        LoanDelinquencyTagsTabComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: LoansService, useValue: {} },
        { provide: Dates, useValue: {} },
        { provide: SettingsService, useValue: { language: { code: 'en' }, dateFormat: 'dd MMMM yyyy' } },
        { provide: MatDialog, useValue: {} },
        { provide: AuthenticationService, useValue: { getCredentials: (): null => null } },
        TranslateService
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LoanDelinquencyTagsTabComponent);
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('td.mat-mdc-cell');
    expect(cells[0].textContent.trim()).toBe('E');
    expect(cells[0].textContent).not.toContain('181');
  });
});
