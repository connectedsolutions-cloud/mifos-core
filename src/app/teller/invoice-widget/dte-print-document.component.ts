import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import QRCode from 'qrcode';
import { DtePrintViewModel } from './dte-print-view.model';

@Component({
  selector: 'mifosx-dte-print-document',
  templateUrl: './dte-print-document.component.html',
  styleUrls: ['./dte-print-document.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DtePrintDocumentComponent implements OnChanges {
  @Input() viewModel: DtePrintViewModel | null = null;

  @ViewChild('printPage', { read: ElementRef })
  private printPageRef?: ElementRef<HTMLElement>;

  qrDataUrl = '';

  getPrintPageElement(): HTMLElement | null {
    return this.printPageRef?.nativeElement ?? null;
  }

  ngOnChanges(): void {
    void this.refreshQr();
  }

  private async refreshQr(): Promise<void> {
    if (!this.viewModel?.qrUrl) {
      this.qrDataUrl = '';
      return;
    }
    try {
      this.qrDataUrl = await QRCode.toDataURL(this.viewModel.qrUrl, { margin: 1, width: 120 });
    } catch {
      this.qrDataUrl = '';
    }
  }
}
