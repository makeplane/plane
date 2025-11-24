import type { TExternalFilter } from "@plane/types";

/**
 * Filter config options.
 */
export type TConfigOptions = Record<string, unknown>;

/**
 * Default filter config options.
 */
export const DEFAULT_FILTER_CONFIG_OPTIONS: TConfigOptions = {};

/**
 * Clear filter config.
 */
export type TClearFilterOptions = {
  label?: string;
  onFilterClear: () => void | Promise<void>;
  isDisabled?: boolean;
};

/**
 * Save view config.
 */
export type TSaveViewOptions<E extends TExternalFilter> = {
  label?: string;
  onViewSave: (expression: E) => void | Promise<void>;
  isDisabled?: boolean;
};

/**
 * Update view config.
 */
export type TUpdateViewOptions<E extends TExternalFilter> = {
  label?: string;
  hasAdditionalChanges?: boolean;
  onViewUpdate: (expression: E) => void | Promise<void>;
  isDisabled?: boolean;
};

/**
 * Filter expression options.
 */
export type TExpressionOptions<E extends TExternalFilter> = {
  clearFilterOptions?: TClearFilterOptions;
  saveViewOptions?: TSaveViewOptions<E>;
  updateViewOptions?: TUpdateViewOptions<E>;
};

/**
 * Default filter expression options.
 */
export const DEFAULT_FILTER_EXPRESSION_OPTIONS: TExpressionOptions<TExternalFilter> = {};

/**
 * Auto visibility options.
 */
export type TAutoVisibilityOptions =
  | {
      autoSetVisibility: true;
    }
  | {
      autoSetVisibility: false;
      isVisibleOnMount: boolean;
    };

/**
 * Default filter visibility options.
 */
export const DEFAULT_FILTER_VISIBILITY_OPTIONS: TAutoVisibilityOptions = {
  autoSetVisibility: true,
};

/**
 * Filter options.
 * - expression: Filter expression options.
 * - config: Filter config options.
 */
export type TFilterOptions<E extends TExternalFilter> = {
  expression: Partial<TExpressionOptions<E>>;
  config: Partial<TConfigOptions>;
  visibility: TAutoVisibilityOptions;
};
