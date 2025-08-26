import {
  FILTER_TYPE,
  TBooleanFilterConfig,
  TDateFilterConfig,
  TFilterConfig,
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
export function createFilterConfig<K extends string, T extends TFilterType, TValue extends TFilterValue = TFilterValue>(
  config: T extends typeof FILTER_TYPE.TEXT
    ? TTextFilterConfig<K, TValue>
    : T extends typeof FILTER_TYPE.NUMBER
      ? TNumberFilterConfig<K, TValue>
      : T extends typeof FILTER_TYPE.BOOLEAN
        ? TBooleanFilterConfig<K>
        : T extends typeof FILTER_TYPE.SELECT
          ? TSelectFilterConfig<K, TValue>
          : T extends typeof FILTER_TYPE.MULTI_SELECT
            ? TMultiSelectFilterConfig<K, TValue>
            : T extends typeof FILTER_TYPE.DATE
              ? TDateFilterConfig<K, TValue>
              : never
): TFilterConfig<K, TValue> {
  return config as TFilterConfig<K, TValue>;
}
