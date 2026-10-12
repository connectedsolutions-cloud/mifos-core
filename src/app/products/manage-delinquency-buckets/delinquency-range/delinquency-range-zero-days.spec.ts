import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ProductsService } from 'app/products/products.service';
import { SettingsService } from 'app/settings/settings.service';
import { CreateRangeComponent } from './create-range/create-range.component';
import { EditRangeComponent } from './edit-range/edit-range.component';

describe('Delinquency range forms', () => {
  const formBuilder = new UntypedFormBuilder();
  const productsService = {} as ProductsService;
  const router = {} as Router;
  const settings = {} as SettingsService;

  it('allows a new A1 range to begin at zero days', () => {
    const component = new CreateRangeComponent(formBuilder, productsService, {} as ActivatedRoute, router, settings);
    component.setInputForm();
    component.delinquencyRangeForm.patchValue({ classification: 'A1', minimumAgeDays: 0, maximumAgeDays: 7 });

    expect(component.delinquencyRangeForm.valid).toBe(true);
    component.delinquencyRangeForm.patchValue({ minimumAgeDays: -1 });
    expect(component.delinquencyRangeForm.valid).toBe(false);
  });

  it('allows an existing A1 range to be changed to begin at zero days', () => {
    const route = {
      data: of({ delinquencyRange: { classification: 'A1', minimumAgeDays: 1, maximumAgeDays: 7 } })
    } as unknown as ActivatedRoute;
    const component = new EditRangeComponent(formBuilder, productsService, route, router, settings);
    component.setInputForm();
    component.delinquencyRangeForm.patchValue({ minimumAgeDays: 0 });

    expect(component.delinquencyRangeForm.valid).toBe(true);
    component.delinquencyRangeForm.patchValue({ minimumAgeDays: -1 });
    expect(component.delinquencyRangeForm.valid).toBe(false);
  });
});
