/** Angular Imports */
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

export interface PagoRow {
  id: string;
  factura: string;
  cliente: string;
  concepto: string;
  monto: number;
  estado: 'Completado' | 'Verificando' | 'Pendiente';
}

/**
 * Pagos section component.
 * Payments list with date filter, search, and register payment action.
 */
@Component({
  selector: 'mifosx-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss'],
  imports: [
    FormsModule,
    MatTableModule,
    MatNativeDateModule,
    MatIconModule,
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class PagosComponent {
  /** Selected date for filtering payments. */
  selectedDate: Date = new Date();

  /** Search filter for table. */
  searchFilter = '';

  /** Table columns. */
  displayedColumns: string[] = [
    'idFactura',
    'cliente',
    'concepto',
    'monto',
    'estado',
    'acciones'
  ];

  /** Payments table data source. */
  paymentsDataSource = new MatTableDataSource<PagoRow>([
    {
      id: 'PAG-001',
      factura: 'INV-2026-001',
      cliente: 'Carlos Ramírez López',
      concepto: 'Pago de servicio mensual',
      monto: 4500,
      estado: 'Completado'
    },
    {
      id: 'PAG-002',
      factura: 'INV-2026-002',
      cliente: 'Ana Martínez Soto',
      concepto: 'Compra de productos',
      monto: 2300,
      estado: 'Completado'
    },
    {
      id: 'PAG-003',
      factura: 'INV-2026-003',
      cliente: 'Empresa XYZ SA',
      concepto: 'Pago de factura corporativa',
      monto: 15000,
      estado: 'Verificando'
    },
    {
      id: 'PAG-004',
      factura: 'INV-2026-004',
      cliente: 'Roberto González',
      concepto: 'Pago anticipado',
      monto: 8700,
      estado: 'Pendiente'
    },
    {
      id: 'PAG-005',
      factura: 'INV-2026-005',
      cliente: 'Laura Hernández',
      concepto: 'Pago de cuota',
      monto: 3200,
      estado: 'Completado'
    }
  ]);

  constructor() {
    this.paymentsDataSource.filterPredicate = (data: PagoRow, filter: string) => {
      const s = filter.toLowerCase();
      return (
        data.cliente.toLowerCase().includes(s) ||
        data.concepto.toLowerCase().includes(s) ||
        data.factura.toLowerCase().includes(s) ||
        data.id.toLowerCase().includes(s)
      );
    };
  }

  onPrevDay(): void {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    this.selectedDate = d;
  }

  onNextDay(): void {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + 1);
    this.selectedDate = d;
  }

  onRegistrarPago(): void {
    // TODO: open register payment dialog
  }

  onConfirmar(row: PagoRow): void {
    // TODO: confirm payment
  }

  onVerificar(row: PagoRow): void {
    // TODO: verify payment
  }

  applyFilter(): void {
    this.paymentsDataSource.filter = this.searchFilter.trim().toLowerCase();
  }
}
