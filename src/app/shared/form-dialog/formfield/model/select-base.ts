import { FormfieldBase } from './formfield-base';

interface SelectOption {
  label: string;
  value: string;
  data: {}[];
  searchLabel?: string; // Optional: field name for searching (e.g., 'name')
  searchCode?: string; // Optional: field name for account code search (e.g., 'glCode')
  displayFormat?: string; // Optional: format string like '({{glCode}}) {{name}}'
}

interface SelectBaseOptions {
  options?: SelectOption;
  controlType?: string;
  controlName?: string;
  label?: string;
  value?: any;
  required?: boolean;
  order?: number;
  searchable?: boolean; // Enable searchable dropdown
}

export class SelectBase extends FormfieldBase {
  controlType = 'select';
  options: SelectOption;
  searchable?: boolean;

  constructor(options: SelectBaseOptions = {}) {
    super(options);
    this.options = options.options || { label: '', value: '', data: [] };
    this.searchable = options.searchable || false;
  }
}
