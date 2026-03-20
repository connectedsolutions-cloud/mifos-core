/** Data for a step detail block (loading, error, or value). */
export interface BlockData {
  value?: unknown;
  loading?: boolean;
  error?: string;
}

/** Block config from STEP_DETAIL_BLOCKS (key + i18n label). */
export interface BlockConfig {
  key: string;
  labelKey: string;
  /** Optional i18n key for the amount line (e.g. vault request vs transfer to vault). */
  amountLabelKey?: string;
}
