import {
  FILTER_TYPE,
  TBooleanFilterConfig,
  TDateFilterConfig,
  TFilterConfig,
  TFilterType,
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
export function createFilterConfig<K extends string, T extends TFilterType>(
  config: T extends typeof FILTER_TYPE.TEXT
    ? TTextFilterConfig<K>
    : T extends typeof FILTER_TYPE.NUMBER
      ? TNumberFilterConfig<K>
      : T extends typeof FILTER_TYPE.BOOLEAN
        ? TBooleanFilterConfig<K>
        : T extends typeof FILTER_TYPE.SELECT
          ? TSelectFilterConfig<K>
          : T extends typeof FILTER_TYPE.MULTI_SELECT
            ? TMultiSelectFilterConfig<K>
            : T extends typeof FILTER_TYPE.DATE
              ? TDateFilterConfig<K>
              : never
): TFilterConfig<K> {
  return config as TFilterConfig<K>;
}
