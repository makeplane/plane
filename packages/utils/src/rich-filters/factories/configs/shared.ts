import {
  FILTER_FIELD_TYPE,
  TBaseFilterFieldConfig,
  TBooleanFilterFieldConfig,
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TFilterConfig,
  TFilterProperty,
  TFilterFieldType,
  TFilterValue,
  TMultiSelectFilterFieldConfig,
  TNumberFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TSupportedFilterFieldConfigs,
  TTextFilterFieldConfig,
} from "@plane/types";

/**
 * Factory function signature for creating filter configurations.
 */
export type TCreateFilterConfig<P extends TFilterProperty, T> = (params: T) => TFilterConfig<P>;

/**
 * Helper to create a type-safe filter field config
 * @param config - The filter field config to create
 * @returns The created filter field config
 */
export const createFilterFieldConfig = <T extends TFilterFieldType, V extends TFilterValue>(
  config: T extends typeof FILTER_FIELD_TYPE.SINGLE_SELECT
    ? TSingleSelectFilterFieldConfig<V>
    : T extends typeof FILTER_FIELD_TYPE.MULTI_SELECT
      ? TMultiSelectFilterFieldConfig<V>
      : T extends typeof FILTER_FIELD_TYPE.DATE
        ? TDateFilterFieldConfig<V>
        : T extends typeof FILTER_FIELD_TYPE.DATE_RANGE
          ? TDateRangeFilterFieldConfig<V>
          : T extends typeof FILTER_FIELD_TYPE.TEXT
            ? TTextFilterFieldConfig<V>
            : T extends typeof FILTER_FIELD_TYPE.NUMBER
              ? TNumberFilterFieldConfig<V>
              : T extends typeof FILTER_FIELD_TYPE.BOOLEAN
                ? TBooleanFilterFieldConfig
                : never
): TSupportedFilterFieldConfigs<V> => config as TSupportedFilterFieldConfigs<V>;

/**
 * Base parameters for filter type config factory functions.
 * - operator: The operator to use for the filter.
 */
export type TCreateFilterConfigParams = TBaseFilterFieldConfig & {
  isEnabled: boolean;
};

/**
 * Icon configuration for filters and their options.
 * - filterIcon: Optional icon for the filter
 * - getOptionIcon: Function to get icon for specific option values
 */
export interface IFilterIconConfig<T extends string | number | boolean | object | undefined = undefined> {
  filterIcon?: React.FC<React.SVGAttributes<SVGElement>>;
  getOptionIcon?: (value: T) => React.ReactNode;
}

/**
 * Date filter config params
 */
export type TCreateDateFilterParams = TCreateFilterConfigParams & IFilterIconConfig<Date>;

// ------------ Default filter type configs ------------

export const DEFAULT_SINGLE_SELECT_FILTER_TYPE_CONFIG = {
  allowNegative: true,
};

export const DEFAULT_MULTI_SELECT_FILTER_TYPE_CONFIG = {
  allowNegative: true,
};

export const DEFAULT_DATE_FILTER_TYPE_CONFIG = {
  allowNegative: true,
};

export const DEFAULT_DATE_RANGE_FILTER_TYPE_CONFIG = {
  allowNegative: true,
};
