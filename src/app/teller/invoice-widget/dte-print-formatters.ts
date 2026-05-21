import { DtePrintInvoice } from './dte-print-pdf.service';

export function formatDateValue(value?: string | string[]): string {
  if (!value) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.slice(0, 3).join('-');
  }
  return String(value).slice(0, 10);
}

export function formatTimeValue(
  value?: string | number[] | { hour?: number; minute?: number; second?: number }
): string {
  if (!value) {
    return '';
  }
  if (Array.isArray(value)) {
    const [
      hour = 0,
      minute = 0,
      second = 0
    ] = value;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }
  if (typeof value === 'object') {
    const hour = value.hour ?? 0;
    const minute = value.minute ?? 0;
    const second = value.second ?? 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }
  return String(value);
}

export function formatEmission(invoice: DtePrintInvoice): string {
  const date = formatDateValue(invoice.fecEmi);
  const time = formatTimeValue(invoice.horEmi);
  if (date && time) {
    return `${date} ${time}`;
  }
  return date || time || '-';
}

export function formatAddress(complemento?: string, municipio?: string, departamento?: string): string {
  return (
    [
      complemento,
      municipio,
      departamento
    ]
      .filter((p) => p?.trim())
      .join(', ') || '-'
  );
}

export function joinParts(a?: string, b?: string): string {
  const parts = [
    a,
    b
  ].filter((p) => p?.trim());
  return parts.length ? parts.join(' - ') : '-';
}

export function formatAmount(value?: number): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0.00';
  }
  return Number(value).toFixed(2);
}

export function money(value?: number, currencyCode = 'USD'): string {
  return `${formatAmount(value)} ${currencyCode}`;
}

export function displayValue(value?: string): string {
  return value?.trim() ? value : '-';
}
