import { VisualReportRecord, VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface IncomeStatementAccount {
  code: string;
  name: string;
  monthlyAmount: number;
  accumulatedAmount: number;
}

export interface IncomeStatementGroup {
  code: string;
  name: string;
  accounts: IncomeStatementAccount[];
  monthlyAmount: number;
  accumulatedAmount: number;
}

export interface IncomeStatementSection {
  name: string;
  groups: IncomeStatementGroup[];
  monthlyAmount: number;
  accumulatedAmount: number;
}

export interface EstadoResultadosConsolidadoViewModel {
  organizationName: string;
  title: string;
  currencyLabel: string;
  periodLabel: string;
  officeName: string;
  generatedOn: string;
  generatedBy: string;
  sections: IncomeStatementSection[];
  resultLabel: string;
  monthlyResult: number;
  accumulatedResult: number;
}

const REQUIRED_COLUMNS = [
  'row_sequence',
  'row_type',
  'office_id',
  'office_name',
  'month_start',
  'year_start',
  'report_date',
  'section_name',
  'group_code',
  'group_name',
  'account_code',
  'account_name',
  'monthly_amount',
  'accumulated_amount'
] as const;

export function buildEstadoResultadosConsolidadoViewModel(
  result: VisualReportResult,
  generatedBy = ''
): EstadoResultadosConsolidadoViewModel {
  const columns = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missing.length > 0) {
    throw new Error(`Estado de Resultados Consolidado is missing required columns: ${missing.join(', ')}.`);
  }

  const records = resultsetToRecords(result).sort(
    (left, right) => requiredNumber(left, 'row_sequence') - requiredNumber(right, 'row_sequence')
  );
  if (records.length === 0) {
    throw new Error('Estado de Resultados Consolidado has no rows.');
  }

  const first = records[0];
  const officeId = requiredNumber(first, 'office_id');
  const officeName = requiredString(first, 'office_name');
  const monthStart = dateParts(first.month_start);
  const yearStart = dateParts(first.year_start);
  const reportDate = dateParts(first.report_date);
  const scopeSignature = `${officeId}|${officeName}|${monthStart.join('-')}|${yearStart.join('-')}|${reportDate.join('-')}`;

  const sections: IncomeStatementSection[] = [];
  const sectionByName = new Map<string, IncomeStatementSection>();
  const groupByKey = new Map<string, IncomeStatementGroup>();
  let currentSection: IncomeStatementSection | null = null;
  let resultRow: VisualReportRecord | null = null;

  for (const record of records) {
    const recordSignature = `${requiredNumber(record, 'office_id')}|${requiredString(record, 'office_name')}|${dateParts(
      record.month_start
    ).join('-')}|${dateParts(record.year_start).join('-')}|${dateParts(record.report_date).join('-')}`;
    if (recordSignature !== scopeSignature) {
      throw new Error('Estado de Resultados Consolidado contains mixed office or date scopes.');
    }

    const rowType = requiredString(record, 'row_type').toUpperCase();
    const sectionName = requiredString(record, 'section_name').toUpperCase();
    if (rowType === 'SECTION') {
      if (sectionByName.has(sectionName)) {
        throw new Error(`Estado de Resultados Consolidado repeats section ${sectionName}.`);
      }
      currentSection = {
        name: sectionName,
        groups: [],
        monthlyAmount: money(record.monthly_amount),
        accumulatedAmount: money(record.accumulated_amount)
      };
      sectionByName.set(sectionName, currentSection);
      sections.push(currentSection);
      continue;
    }

    if (rowType === 'GROUP') {
      currentSection = sectionByName.get(sectionName) ?? null;
      if (!currentSection) {
        throw new Error(`Estado de Resultados Consolidado group precedes section ${sectionName}.`);
      }
      const code = requiredString(record, 'group_code');
      const key = `${sectionName}|${code}`;
      if (groupByKey.has(key)) {
        throw new Error(`Estado de Resultados Consolidado repeats group ${code}.`);
      }
      const group: IncomeStatementGroup = {
        code,
        name: requiredString(record, 'group_name'),
        accounts: [],
        monthlyAmount: money(record.monthly_amount),
        accumulatedAmount: money(record.accumulated_amount)
      };
      groupByKey.set(key, group);
      currentSection.groups.push(group);
      continue;
    }

    if (rowType === 'ACCOUNT') {
      const groupCode = requiredString(record, 'group_code');
      const group = groupByKey.get(`${sectionName}|${groupCode}`);
      if (!group) {
        throw new Error(`Estado de Resultados Consolidado account precedes group ${groupCode}.`);
      }
      group.accounts.push({
        code: requiredString(record, 'account_code'),
        name: requiredString(record, 'account_name'),
        monthlyAmount: money(record.monthly_amount),
        accumulatedAmount: money(record.accumulated_amount)
      });
      continue;
    }

    if (rowType === 'RESULT') {
      if (resultRow) {
        throw new Error('Estado de Resultados Consolidado contains more than one result row.');
      }
      resultRow = record;
      continue;
    }

    throw new Error(`Estado de Resultados Consolidado has unsupported row type ${rowType}.`);
  }

  if (sections.map((section) => section.name).join('|') !== 'INGRESOS|GASTOS') {
    throw new Error('Estado de Resultados Consolidado requires INGRESOS followed by GASTOS.');
  }
  if (!resultRow) {
    throw new Error('Estado de Resultados Consolidado is missing its result row.');
  }

  for (const section of sections) {
    if (section.groups.length === 0 || section.groups.some((group) => group.accounts.length === 0)) {
      throw new Error(`Estado de Resultados Consolidado contains an empty ${section.name} group.`);
    }
    for (const group of section.groups) {
      assertTotal(`${section.name} group ${group.code}`, group.monthlyAmount, group.accounts, 'monthlyAmount');
      assertTotal(`${section.name} group ${group.code}`, group.accumulatedAmount, group.accounts, 'accumulatedAmount');
    }
    assertTotal(section.name, section.monthlyAmount, section.groups, 'monthlyAmount');
    assertTotal(section.name, section.accumulatedAmount, section.groups, 'accumulatedAmount');
  }

  const income = sections[0];
  const expenses = sections[1];
  const monthlyResult = cents(income.monthlyAmount - expenses.monthlyAmount);
  const accumulatedResult = cents(income.accumulatedAmount - expenses.accumulatedAmount);
  if (monthlyResult !== money(resultRow.monthly_amount) || accumulatedResult !== money(resultRow.accumulated_amount)) {
    throw new Error('Estado de Resultados Consolidado result does not reconcile to income less expenses.');
  }
  const resultLabel = requiredString(resultRow, 'account_name').toUpperCase();
  if (resultLabel !== (accumulatedResult < 0 ? 'DÉFICIT' : 'EXCEDENTE')) {
    throw new Error('Estado de Resultados Consolidado result label does not match its accumulated sign.');
  }

  return {
    organizationName: 'CREDESAL S.C. DE R.L. DE C.V.',
    title: 'ESTADO DE RESULTADOS CONSOLIDADO',
    currencyLabel: 'Cifras en Dólares de los Estados Unidos de Norte América ($)',
    periodLabel: `PERIODO DEL ${yearStart[2]} de ${monthName(yearStart[1])} AL ${reportDate[2]} de ${monthName(
      reportDate[1]
    )} de ${reportDate[0]}`,
    officeName,
    generatedOn: formatDate(dateParts(new Date())),
    generatedBy,
    sections,
    resultLabel,
    monthlyResult,
    accumulatedResult
  };
}

function assertTotal<T extends { monthlyAmount: number; accumulatedAmount: number }>(
  label: string,
  declared: number,
  items: T[],
  key: 'monthlyAmount' | 'accumulatedAmount'
): void {
  const computed = cents(items.reduce((total, item) => total + item[key], 0));
  if (computed !== declared) {
    throw new Error(`${label} ${key} total does not match its detail rows.`);
  }
}

function requiredString(record: VisualReportRecord, key: string): string {
  const value = record[key] == null ? '' : String(record[key]).trim();
  if (!value) {
    throw new Error(`Estado de Resultados Consolidado field ${key} is required.`);
  }
  return value;
}

function requiredNumber(record: VisualReportRecord, key: string): number {
  const value = Number(record[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`Estado de Resultados Consolidado field ${key} must be numeric.`);
  }
  return value;
}

function money(value: unknown): number {
  const number = value == null || value === '' ? 0 : Number(value);
  if (!Number.isFinite(number)) {
    throw new Error('Estado de Resultados Consolidado contains an invalid amount.');
  }
  return cents(number);
}

function cents(value: number): number {
  return Math.round((value + Math.sign(value || 1) * Number.EPSILON) * 100) / 100;
}

function dateParts(value: unknown): [number, number, number] {
  if (Array.isArray(value) && value.length >= 3) {
    return [
      Number(value[0]),
      Number(value[1]),
      Number(value[2])];
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('Estado de Resultados Consolidado contains an invalid date.');
  }
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  ];
}

function formatDate(parts: [number, number, number]): string {
  return `${String(parts[2]).padStart(2, '0')}/${String(parts[1]).padStart(2, '0')}/${parts[0]}`;
}

function monthName(month: number): string {
  const names = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE'
  ];
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Estado de Resultados Consolidado contains an invalid month.');
  }
  return names[month - 1];
}
