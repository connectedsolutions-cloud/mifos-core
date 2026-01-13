import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { FormfieldBase } from './model/formfield-base';
import { SelectBase } from './model/select-base';
import { MatCheckbox } from '@angular/material/checkbox';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { NgFor, AsyncPipe } from '@angular/common';

@Component({
  selector: 'mifosx-formfield',
  templateUrl: './formfield.component.html',
  styleUrls: ['./formfield.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatCheckbox,
    NgxMatSelectSearchModule,
    NgFor,
    AsyncPipe
  ]
})
export class FormfieldComponent implements OnInit, OnDestroy {
  @Input() form: UntypedFormGroup;
  @Input() formfield: FormfieldBase;

  /** Control for the filter input */
  filterFormCtrl: UntypedFormControl = new UntypedFormControl('');

  /** Filtered data for searchable selects */
  filteredData: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  /** Subject that emits when the component has been destroyed */
  protected _onDestroy = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    if (this.isSearchableSelect()) {
      const selectField = this.formfield as SelectBase;
      // Initialize with all data
      this.filteredData.next(selectField.options.data.slice());

      // Listen for search field value changes
      this.filterFormCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
        this.filterOptions();
      });
    }
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  isSearchableSelect(): boolean {
    return this.formfield.controlType === 'select' && (this.formfield as SelectBase).searchable === true;
  }

  filterOptions(): void {
    const selectField = this.formfield as SelectBase;
    if (!selectField.options.data) {
      return;
    }

    const search: string = this.filterFormCtrl.value;
    if (!search) {
      this.filteredData.next(selectField.options.data.slice());
      return;
    }

    const filtered = selectField.options.data.filter((option: any) => {
      const labelValue = option[selectField.options.label]?.toString().toLowerCase() || '';
      const codeValue = selectField.options.searchCode
        ? option[selectField.options.searchCode]?.toString().toLowerCase() || ''
        : '';
      const searchLower = search.toLowerCase();

      return labelValue.indexOf(searchLower) >= 0 || codeValue.indexOf(searchLower) >= 0;
    });

    this.filteredData.next(filtered);
  }

  getSelectOptions(): SelectBase['options'] {
    return (this.formfield as SelectBase).options;
  }

  getDisplayValue(option: any): string {
    const selectField = this.formfield as SelectBase;

    if (selectField.options.displayFormat) {
      // Use custom display format (e.g., '({{glCode}}) {{name}}')
      let displayValue = selectField.options.displayFormat;

      // Replace placeholders like {{fieldName}} with actual values
      const matches = displayValue.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        matches.forEach((match: string) => {
          const fieldName = match.replace(/\{\{|\}\}/g, '');
          const fieldValue = option[fieldName] || '';
          displayValue = displayValue.replace(match, fieldValue);
        });
      }

      return displayValue;
    }

    // Default: just return the label field
    return option[selectField.options.label] || '';
  }
}
