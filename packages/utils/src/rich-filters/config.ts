import {
  FILTER_TYPE,
  TBooleanFilterConfig,
  TDateFilterConfig,
  TFilterConfig,
  TFilterProperty,
  TFilterType,
  TFilterValue,
  TMultiSelectFilterConfig,
  TNumberFilterConfig,
  TSelectFilterConfig,
  TTextFilterConfig,
} from "@plane/types";

/**
 * Helper to create a type-safe filter config
 * @param config - The filter config to create
 * @returns The created filter config
 */
export function createFilterConfig<P extends TFilterProperty, T extends TFilterType, V extends TFilterValue>(
  config: T extends typeof FILTER_TYPE.TEXT
    ? TTextFilterConfig<P, V>
    : T extends typeof FILTER_TYPE.NUMBER
      ? TNumberFilterConfig<P, V>
      : T extends typeof FILTER_TYPE.BOOLEAN
        ? TBooleanFilterConfig<P>
        : T extends typeof FILTER_TYPE.SELECT
          ? TSelectFilterConfig<P, V>
          : T extends typeof FILTER_TYPE.MULTI_SELECT
            ? TMultiSelectFilterConfig<P, V>
            : T extends typeof FILTER_TYPE.DATE
              ? TDateFilterConfig<P, V>
              : never
): TFilterConfig<P, V> {
  return config as TFilterConfig<P, V>;
}
