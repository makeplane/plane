// local imports
import { TFilterExpression } from "./base";

/**
 * Filter adapter interface.
 * @template FilterPropertyKey - The type of the filter property key.
 * @template TExternalFilterType - The type of the external filter.
 */
export interface IFilterAdapter<FilterPropertyKey extends string, TExternalFilterType> {
  /**
   * Converts an external filter to an internal filter.
   * @param externalFilter - The external filter to convert.
   * @returns The internal filter.
   */
  toInternal(externalFilter: TExternalFilterType): TFilterExpression<FilterPropertyKey> | null;
  /**
   * Converts an internal filter to an external filter.
   * @param internalFilter - The internal filter to convert.
   * @returns The external filter.
   */
  toExternal(internalFilter: TFilterExpression<FilterPropertyKey> | null): TExternalFilterType;
}
