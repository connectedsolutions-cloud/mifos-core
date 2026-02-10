/** Angular Imports */
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

export type DesembolsoStatus = 'completado' | 'enviado' | 'pendiente';

export interface DesembolsoItem {
  id: string;
  beneficiario: string;
  concepto: string;
  monto: number;
  status: DesembolsoStatus;
}

/**
 * Desembolsos section component.
 * Disbursements list with date navigation, search, and new disbursement action.
 */
@Component({
  selector: 'mifosx-desembolsos',
  templateUrl: './desembolsos.component.html',
  styleUrls: ['./desembolsos.component.scss'],
  imports: [
    FormsModule,
    MatIcon,
    MatIconButton,
    MatFormField,
    MatPrefix,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class DesembolsosComponent {
  /** Selected date. */
  selectedDate = signal(new Date(2026, 1, 2));

  /** Formatted date for display (e.g. "lunes, 2 de febrero de 2026"). */
  selectedDateFormatted = computed(() => {
    const d = this.selectedDate();
    return d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  /** Search filter. */
  searchFilter = '';

  /** All disbursements (mock data). */
  desembolsos: DesembolsoItem[] = [
    {
      id: 'DESEMB-001',
      beneficiario: 'Juan Pérez García',
      concepto: 'Pago de nómina - Enero 2026',
      monto: 15000,
      status: 'completado'
    },
    {
      id: 'DESEMB-002',
      beneficiario: 'Proveedores SA de CV',
      concepto: 'Pago de factura #5678',
      monto: 25000,
      status: 'enviado'
    },
    {
      id: 'DESEMB-003',
      beneficiario: 'María López Martínez',
      concepto: 'Reembolso de gastos',
      monto: 8500,
      status: 'pendiente'
    },
    {
      id: 'DESEMB-004',
      beneficiario: 'Servicios Generales',
      concepto: 'Pago de servicios - Diciembre',
      monto: 12000,
      status: 'completado'
    }
  ];

  /** Filtered disbursements based on search. */
  filteredDesembolsos: DesembolsoItem[] = [...this.desembolsos];

  constructor() {}

  onPrevDate(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
    this.loadDesembolsosForDate(d);
  }

  onNextDate(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
    this.loadDesembolsosForDate(d);
  }

  openDatePicker(): void {
    // TODO: open mat-datepicker popup
  }

  loadDesembolsosForDate(_date: Date): void {
    // TODO: load from API
  }

  applyFilter(): void {
    const q = this.searchFilter.trim().toLowerCase();
    if (!q) {
      this.filteredDesembolsos = [...this.desembolsos];
      return;
    }
    this.filteredDesembolsos = this.desembolsos.filter(
      (d) =>
        d.beneficiario.toLowerCase().includes(q) ||
        d.concepto.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
    );
  }

  onNuevoDesembolso(): void {
    // TODO: open new disbursement dialog
  }

  onDesembolsoClick(_item: DesembolsoItem): void {
    // TODO: navigate to detail or open detail dialog
  }
}
