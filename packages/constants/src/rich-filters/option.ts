/**
 * Filter config options.
 * - allowSameFilters: Whether to allow multiple filters of the same type.
 */
export type TConfigOptions = {
  allowSameFilters: boolean;
};

/**
 * Default filter config options.
 * - allowSameFilters: Whether to allow multiple filters of the same type.
 */
export const DEFAULT_FILTER_CONFIG_OPTIONS: TConfigOptions = {
  allowSameFilters: false,
};

/**
 * Filter expression options.
 * - trackChanges: Whether to track changes to the filter expression.
 */
export type TExpressionOptions = {
  trackChanges: boolean;
};

/**
 * Default filter expression options.
 * - trackChanges: Whether to track changes to the filter expression.
 */
export const DEFAULT_FILTER_EXPRESSION_OPTIONS: TExpressionOptions = {
  trackChanges: false,
};

/**
 * Filter options.
 * - expression: Filter expression options.
 * - config: Filter config options.
 */
export type TFilterOptions = {
  expression: Partial<TExpressionOptions>;
  config: Partial<TConfigOptions>;
};
