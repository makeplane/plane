import type {
  FILTER_FIELD_TYPE,
  TBaseFilterFieldConfig,
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TFilterConfig,
  TFilterProperty,
  TFilterFieldType,
  TFilterValue,
  TMultiSelectFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TSupportedFilterFieldConfigs,
  TSupportedOperators,
  TOperatorSpecificConfigs,
} from "@plane/types";

/**
 * Helper to create a type-safe filter config
 * @param config - The filter config to create
 * @returns The created filter config
 */
export const createFilterConfig = <P extends TFilterProperty>(config: TFilterConfig<P>): TFilterConfig<P> => config;

/**
 * Base parameters for filter type config factory functions.
 * - operator: The operator to use for the filter.
 */
export type TCreateFilterConfigParams = Omit<TBaseFilterFieldConfig, "isOperatorEnabled"> & {
  isEnabled: boolean;
  allowedOperators: Set<TSupportedOperators>;
  rightContent?: React.ReactNode; // content to display on the right side of the filter option in the dropdown
  tooltipContent?: React.ReactNode; // content to display when hovering over the applied filter item in the filter list
};

/**
 * Type for filter icon type
 */
export type TFilterIconType = string | number | boolean | object | undefined;

/**
 * Icon configuration for filters and their options.
 * - filterIcon: Optional icon for the filter
 * - getOptionIcon: Function to get icon for specific option values
 */
export interface IFilterIconConfig<T extends TFilterIconType = undefined> {
  filterIcon?: React.FC<React.SVGAttributes<SVGElement>>;
  getOptionIcon?: (value: T) => React.ReactNode;
}

/**
 * Date filter config params
 */
export type TCreateDateFilterParams = TCreateFilterConfigParams & IFilterIconConfig<Date>;

/**
 * Helper to create an operator entry for the supported operators map.
 * This ensures consistency between the operator key and the operator passed to the config function.
 * Returns a type compatible with TOperatorSpecificConfigs so Map constructor accepts union types.
 * @param operator - The operator to use as both key and parameter
 * @param createParams - The base filter configuration parameters
 * @param configFn - Function that creates the operator config using base configuration
 * @returns A tuple of operator and its config, typed to be compatible with operator configs map
 */
export const createOperatorConfigEntry = <
  T extends TOperatorSpecificConfigs[keyof TOperatorSpecificConfigs],
  P extends TCreateFilterConfigParams,
>(
  operator: TSupportedOperators,
  createParams: P,
  configFn: (updatedParams: P) => T
): [TSupportedOperators, TOperatorSpecificConfigs[keyof TOperatorSpecificConfigs]] => [
  operator,
  configFn({ isOperatorEnabled: createParams.allowedOperators.has(operator), ...createParams }),
];

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
          : never
): TSupportedFilterFieldConfigs<V> => config as TSupportedFilterFieldConfigs<V>;
