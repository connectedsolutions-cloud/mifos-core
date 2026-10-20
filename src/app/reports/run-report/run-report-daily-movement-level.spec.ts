jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { RunReportComponent } from './run-report.component';

describe('daily movement Nivel parameter', () => {
  it('preselects level 3 and sends the selected numeric id to Fineract', () => {
    const component = Object.create(RunReportComponent.prototype) as RunReportComponent;
    component.report = { type: 'Table', subType: 'VisualDailyMovement' };
    component.reportForm = new UntypedFormGroup({
      CredesalDailyMovementLevel: new UntypedFormControl('')
    });
    const options = [
      { id: 3, name: '3 MAYOR' },
      { id: 4, name: '4 SUBCUENTA' },
      { id: 5, name: '5 SUB SUB CUENTA' },
      { id: 6, name: '6 SUB SUB SUB CUENTA' },
      { id: 7, name: '7 DETALLE' }
    ];
    (component as any).reportsService = { getSelectOptions: () => of(options) };
    const parameter = {
      name: 'CredesalDailyMovementLevel',
      variable: 'level',
      label: 'Nivel',
      inputName: 'R_level',
      displayType: 'select',
      selectOptions: [],
      selectAll: 'N'
    } as any;
    component.paramData = [parameter];

    component.fetchSelectOptions(parameter, parameter.name);
    expect(component.reportForm.get(parameter.name)?.value).toEqual(options[0]);
    expect(component.formatUserResponse(component.reportForm.value)).toEqual({ R_level: '3' });

    component.reportForm.get(parameter.name)?.setValue(options[4]);
    expect(component.formatUserResponse(component.reportForm.value)).toEqual({ R_level: '7' });
  });
});
