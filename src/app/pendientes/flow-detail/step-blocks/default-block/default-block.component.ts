import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { BlockConfig, BlockData } from '../block.interface';

@Component({
  selector: 'mifosx-default-block',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './default-block.component.html',
  styleUrls: ['../block-common.scss']
})
export class DefaultBlockComponent {
  @Input() block!: BlockConfig;
  @Input() blockData: BlockData | undefined;
}
