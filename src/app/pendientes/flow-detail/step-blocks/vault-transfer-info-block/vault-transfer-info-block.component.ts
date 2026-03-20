import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import type { BlockConfig, BlockData } from '../block.interface';

export interface VaultTransferInfoValue {
  amount?: number;
  currencyCode?: string;
  notes?: string;
}

@Component({
  selector: 'mifosx-vault-transfer-info-block',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './vault-transfer-info-block.component.html',
  styleUrls: ['../block-common.scss']
})
export class VaultTransferInfoBlockComponent {
  @Input() block!: BlockConfig;
  @Input() blockData: BlockData | undefined;

  get amount(): number {
    const data = this.blockData?.value as VaultTransferInfoValue | undefined;
    const val = data?.amount;
    return val != null ? Number(val) : 0;
  }

  get currencyCode(): string | null {
    const data = this.blockData?.value as VaultTransferInfoValue | undefined;
    const s = data?.currencyCode;
    return s != null && String(s).trim() !== '' ? String(s).trim() : null;
  }

  get notes(): string | null {
    const data = this.blockData?.value as VaultTransferInfoValue | undefined;
    const s = data?.notes;
    return s != null && String(s).trim() !== '' ? String(s).trim() : null;
  }
}
