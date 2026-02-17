import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import type { BlockConfig, BlockData } from '../block.interface';

@Component({
  selector: 'mifosx-comite-disbursement-sum-block',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './comite-disbursement-sum-block.component.html',
  styleUrls: ['../block-common.scss']
})
export class ComiteDisbursementSumBlockComponent {
  @Input() block!: BlockConfig;
  @Input() blockData: BlockData | undefined;

  get amount(): number {
    const data = this.blockData?.value as { totalDisbursementAmount?: number | null } | undefined;
    const val = data?.totalDisbursementAmount;
    return val != null ? Number(val) : 0;
  }

  get currency(): string | null {
    const data = this.blockData?.value as { currencyCode?: string } | undefined;
    return data?.currencyCode ?? null;
  }
}
