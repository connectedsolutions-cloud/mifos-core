import { Type } from '@angular/core';
import { ComiteDisbursementSumBlockComponent } from './comite-disbursement-sum-block/comite-disbursement-sum-block.component';
import { DefaultBlockComponent } from './default-block/default-block.component';

/** Maps block key to component class for dynamic rendering. */
export const BLOCK_REGISTRY: Record<string, Type<unknown>> = {
  comite_disbursement_sum: ComiteDisbursementSumBlockComponent
};

/** Returns the component for a block key, or DefaultBlockComponent for unknown keys. */
export function getBlockComponent(key: string): Type<unknown> {
  return BLOCK_REGISTRY[key] ?? DefaultBlockComponent;
}

export { DefaultBlockComponent };
