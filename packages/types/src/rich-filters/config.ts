import { FILTER_TYPE, TFilterType } from "./base";
import {
  TAllOperators,
  TBooleanOperators,
  TDateOperators,
  TMultiSelectOperators,
  TNumberOperators,
  TSelectOperators,
  TTextOperators,
} from "./operator";

/**
 * Filter value.
 * @template T - The type of the filter value.
 */
export type TFilterValue = string | number | Date | boolean | null;

/**
 * Filter values.
 * @template T - The type of the filter value.
 */
export type TFilterValues = TFilterValue | TFilterValue[];

/**
 * Filter option.
 * - id: The id of the filter option.
 * - label: The label of the filter option.
 * - value: The value of the filter option.
 * - icon?: The icon of the filter option.
 * - iconClassName?: The class name of the filter option icon.
 * - disabled?: Whether the filter option is disabled.
 * - description?: The description of the filter option.
 * @template T - The type of the filter value.
 */
export interface TFilterOption<T extends TFilterValue = TFilterValue> {
  id: string;
  label: string;
  value: T;
  icon?: React.ReactNode;
  iconClassName?: string;
  disabled?: boolean;
  description?: string;
}

/**
 * Base filter config.
 * - id: The id of the filter.
 * - label: The label of the filter.
 * - type: The type of the filter.
 * - icon?: The icon of the filter.
 * - placeholder?: The placeholder of the filter.
 * - isEnabled: Whether the filter is enabled.
 * - allowMultiple?: Whether the filter allows multiple values.
 */
export interface TBaseFilterConfig<K extends string = string> {
  id: K;
  label: string;
  type: TFilterType;
  icon?: React.FC<React.SVGAttributes<SVGElement>>;
  placeholder?: string;
  isEnabled: boolean;
  defaultValue: TFilterValues;
  customOperators?: TAllOperators[];
}

/**
 * Text filter configuration.
 * Extends the base filter config with text-specific properties.
 * - type: Always set to EFilterType.TEXT for text filters.
 * - defaultOperator: The default text operator to use when the filter is applied.
 */
export interface TTextFilterConfig<K extends string = string> extends TBaseFilterConfig<K> {
  type: typeof FILTER_TYPE.TEXT;
  defaultOperator: TTextOperators;
}

/**
 * Number filter configuration.
 * Extends the base filter config with number-specific properties.
 * - type: Always set to EFilterType.NUMBER for number filters.
 * - defaultOperator: The default number operator to use when the filter is applied.
 * - min?: The minimum value of the filter.
 * - max?: The maximum value of the filter.
 */
export interface TNumberFilterConfig<K extends string = string> extends TBaseFilterConfig<K> {
  type: typeof FILTER_TYPE.NUMBER;
  defaultOperator: TNumberOperators;
  min?: number;
  max?: number;
}

/**
 * Boolean filter configuration.
 * Extends the base filter config with boolean-specific properties.
 * - type: Always set to EFilterType.BOOLEAN for boolean filters.
 * - defaultOperator: The default boolean operator to use when the filter is applied.
 */
export interface TBooleanFilterConfig<K extends string = string> extends TBaseFilterConfig<K> {
  type: typeof FILTER_TYPE.BOOLEAN;
  defaultOperator: TBooleanOperators;
}

/**
 * Select filter configuration.
 * Extends the base filter config with select-specific properties.
 * - type: Always set to EFilterType.SELECT for select filters.
 * - defaultOperator: The default select operator to use when the filter is applied.
 * - getOptions: A function that returns the options for the select filter.
 */
export interface TSelectFilterConfig<K extends string = string> extends TBaseFilterConfig<K> {
  type: typeof FILTER_TYPE.SELECT;
  defaultOperator: TSelectOperators;
  getOptions: TFilterOption<string>[] | (() => TFilterOption<string>[] | Promise<TFilterOption<string>[]>);
}

/**
 * Multi-select filter configuration.
 * Extends the base filter config with multi-select-specific properties.
 * - type: Always set to EFilterType.MULTI_SELECT for multi-select filters.
 * - defaultOperator: The default multi-select operator to use when the filter is applied.
 * - getOptions: A function that returns the options for the multi-select filter.
 */
export interface TMultiSelectFilterConfig<K extends string = string> extends TBaseFilterConfig<K> {
  type: typeof FILTER_TYPE.MULTI_SELECT;
  defaultOperator: TMultiSelectOperators;
  getOptions: TFilterOption<string>[] | (() => TFilterOption<string>[] | Promise<TFilterOption<string>[]>);
}

/**
 * Date filter configuration.
 * Extends the base filter config with date-specific properties.
 * - type: Always set to EFilterType.DATE for date filters.
 * - defaultOperator: The default date operator to use when the filter is applied.
 */
export interface TDateFilterConfig<K extends string = string> extends TBaseFilterConfig<K> {
  type: typeof FILTER_TYPE.DATE;
  defaultOperator: TDateOperators;
}

/**
 * Filter configuration.
 * Combines all filter configurations into a single type.
 * @template K - The type of the filter id.
 */
export type TFilterConfig<K extends string = string> =
  | TTextFilterConfig<K>
  | TNumberFilterConfig<K>
  | TBooleanFilterConfig<K>
  | TSelectFilterConfig<K>
  | TMultiSelectFilterConfig<K>
  | TDateFilterConfig<K>;

/**
 * Base parameters for all filter config creators
 */
export type TCreateFilterConfigParams = {
  isEnabled: boolean;
};

/**
 * Icon configuration for filter options
 */
export type TFilterIconConfig<T extends string | number | boolean | object | undefined = undefined> = {
  filterIcon?: React.FC<React.SVGAttributes<SVGElement>>;
  getOptionIcon?: (value: T) => React.ReactNode;
};

/**
 * Function signature for creating filter configurations
 */
export type TCreateFilterConfig<K extends string, P> = (params: P) => TFilterConfig<K>;
