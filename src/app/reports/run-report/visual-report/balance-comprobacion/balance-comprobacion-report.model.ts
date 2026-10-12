import { VisualReportResult, resultsetToRecords } from '../visual-report-result';

export interface TrialBalanceRow {
  type: string;
  label: string;
  amount: number | null;
  lastInGroup?: boolean;
}

export interface TrialBalanceDocument {
  organizationName: string;
  title: string;
  dateLabel: string;
  currencyLabel: string;
  pages: TrialBalanceRow[][];
}

const COLUMNS = [
  'Orden',
  'Tipo Fila',
  'Sección',
  'Grupo',
  'Cuenta',
  'Descripción',
  'Saldo'
];
const SECTIONS = [
  'ACTIVO',
  'RESULTADO DEUDORAS',
  'PASIVO',
  'CAPITAL',
  'RESULTADO ACREEDORAS'
];
const TYPES = new Set([
  'SECCION',
  'GRUPO',
  'CUENTA',
  'TOTAL_SECCION',
  'TOTAL_INTERMEDIO',
  'TOTAL_BALANCE'
]);
const MONTHS = [
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

export function buildBalanceComprobacionDocument(result: VisualReportResult, cutoff: string): TrialBalanceDocument {
  const headers = new Set((result?.columnHeaders ?? []).map((header) => header.columnName));
  const missing = COLUMNS.filter((column) => !headers.has(column));
  if (missing.length) throw new Error(`Balance de Comprobación: faltan columnas ${missing.join(', ')}.`);

  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cutoff ?? '');
  if (
    !date ||
    Number(date[2]) < 1 ||
    Number(date[2]) > 12 ||
    new Date(Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]))).toISOString().slice(0, 10) !== cutoff
  ) {
    throw new Error('Balance de Comprobación: fecha de corte inválida.');
  }

  const records = resultsetToRecords(result).sort((a, b) => Number(a.Orden) - Number(b.Orden));
  if (!records.length) throw new Error('Balance de Comprobación: no hay filas.');
  const pages: TrialBalanceRow[][] = [
    [],
    []
  ];
  const seenSections: string[] = [];
  let page = 0;
  let groupAmount: number | null = null;
  let componentSum = 0;
  let componentCount = 0;
  let assetTotal: number | null = null;
  let assetGroups = 0;
  let debtorTotal = 0;
  let liabilityTotal: number | null = null;
  let liabilityGroups = 0;
  let capitalTotal = 0;
  let creditorTotal = 0;
  let leftTotal: number | null = null;
  let rightTotal: number | null = null;
  let currentSection = '';
  const finishGroup = () => {
    if (groupAmount !== null && (componentCount === 0 || cents(groupAmount) !== cents(componentSum))) {
      throw new Error('Balance de Comprobación: un grupo no coincide con sus cuentas.');
    }
    if (groupAmount !== null) {
      pages[page][pages[page].length - 1].lastInGroup = true;
    }
    groupAmount = null;
    componentSum = 0;
    componentCount = 0;
  };

  records.forEach((record, index) => {
    if (Number(record.Orden) !== index + 1) throw new Error('Balance de Comprobación: orden de filas inválido.');
    const type = String(record['Tipo Fila'] ?? '')
      .trim()
      .toUpperCase();
    if (!TYPES.has(type)) throw new Error(`Balance de Comprobación: tipo de fila ${type} desconocido.`);
    const label = String(record['Descripción'] ?? '').trim();
    if (!label) throw new Error('Balance de Comprobación: descripción vacía.');
    const amount = type === 'SECCION' ? null : numericAmount(record.Saldo);
    if (type !== 'CUENTA') finishGroup();

    if (type === 'SECCION') {
      if (label !== SECTIONS[seenSections.length])
        throw new Error('Balance de Comprobación: orden de secciones inválido.');
      currentSection = label;
      seenSections.push(label);
      if (label === 'PASIVO') page = 1;
    } else if (type === 'GRUPO') {
      if (!currentSection) throw new Error('Balance de Comprobación: grupo sin sección.');
      groupAmount = amount;
      if (currentSection === 'ACTIVO') assetGroups += amount!;
      if (currentSection === 'RESULTADO DEUDORAS') debtorTotal += amount!;
      if (currentSection === 'PASIVO') liabilityGroups += amount!;
      if (currentSection === 'CAPITAL') capitalTotal += amount!;
      if (currentSection === 'RESULTADO ACREEDORAS') creditorTotal += amount!;
    } else if (type === 'CUENTA') {
      if (groupAmount === null) throw new Error('Balance de Comprobación: cuenta sin grupo.');
      componentSum += amount!;
      componentCount++;
    } else if (type === 'TOTAL_SECCION') {
      if (label === 'TOTAL ACTIVO') assetTotal = amount;
      else if (label === 'TOTAL PASIVO') liabilityTotal = amount;
      else throw new Error('Balance de Comprobación: total de sección desconocido.');
    } else if (type === 'TOTAL_INTERMEDIO') {
      if (
        label !== 'TOTAL PASIVO, PATRIMONIO Y RESERVAS' ||
        liabilityTotal === null ||
        cents(amount!) !== cents(liabilityTotal + capitalTotal)
      ) {
        throw new Error('Balance de Comprobación: total de pasivo y capital inválido.');
      }
    } else if (label === 'TOTAL DE ACTIVO Y CUENTAS DEUDORAS') leftTotal = amount;
    else if (label === 'TOTALES') rightTotal = amount;
    else throw new Error('Balance de Comprobación: total de balance desconocido.');

    pages[page].push({ type, label, amount });
  });
  finishGroup();
  if (
    seenSections.join('|') !== SECTIONS.join('|') ||
    assetTotal === null ||
    liabilityTotal === null ||
    leftTotal === null ||
    rightTotal === null ||
    cents(leftTotal) !== cents(assetTotal + debtorTotal) ||
    cents(assetTotal) !== cents(assetGroups) ||
    cents(liabilityTotal) !== cents(liabilityGroups) ||
    cents(rightTotal) !== cents(liabilityTotal + capitalTotal + creditorTotal) ||
    cents(leftTotal) !== cents(rightTotal)
  ) {
    throw new Error('Balance de Comprobación: los totales del balance no concilian.');
  }

  return {
    organizationName: 'CREDESAL S.C. DE R.L. DE C.V.',
    title: 'BALANCE DE COMPROBACIÓN',
    dateLabel: `Al ${Number(date[3])} de ${MONTHS[Number(date[2]) - 1]} de ${date[1]}`,
    currencyLabel: 'Dólares de los Estados Unidos de Norte América ($)',
    pages
  };
}

function numericAmount(value: unknown): number {
  if (value === null || value === '' || !Number.isFinite(Number(value))) {
    throw new Error('Balance de Comprobación: saldo inválido.');
  }
  return Math.round(Number(value) * 100) / 100;
}

function cents(value: number): number {
  return Math.round(value * 100);
}
