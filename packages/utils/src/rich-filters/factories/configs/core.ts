// plane imports
import type { TFilterValue, TSupportedOperators, TBaseFilterFieldConfig } from "@plane/types";
import { FILTER_FIELD_TYPE } from "@plane/types";
// local imports
import type { IFilterIconConfig } from "./shared";
import { createFilterFieldConfig } from "./shared";

// ------------ Selection filters ------------

/**
 * Options transformation interface for selection filters
 */
export interface TOptionTransforms<TItem, TValue extends TFilterValue = string, TIconData = undefined> {
  items: TItem[];
  getId: (item: TItem) => string;
  getLabel: (item: TItem) => string;
  getValue: (item: TItem) => TValue;
  getIconData?: (item: TItem) => TIconData;
}

/**
 * Single-select filter configuration
 */
export type TSingleSelectConfig<TValue extends TFilterValue = string> = TBaseFilterFieldConfig & {
  defaultValue?: TValue;
};

/**
 * Helper to get the single select config
 * @param transforms - How to transform items into options
 * @param config - Single-select specific configuration
 * @param iconConfig - Icon configuration for options
 * @returns The single select config
 */
export const getSingleSelectConfig = <
  TItem,
  TValue extends TFilterValue = string,
  TIconData extends string | number | boolean | object | undefined = undefined,
>(
  transforms: TOptionTransforms<TItem, TValue, TIconData>,
  config: TSingleSelectConfig<TValue>,
  iconConfig?: IFilterIconConfig<TIconData>
) =>
  createFilterFieldConfig<typeof FILTER_FIELD_TYPE.SINGLE_SELECT, TValue>({
    type: FILTER_FIELD_TYPE.SINGLE_SELECT,
    ...config,
    getOptions: () =>
      transforms.items.map((item) => ({
        id: transforms.getId(item),
        label: transforms.getLabel(item),
        value: transforms.getValue(item),
        icon: iconConfig?.getOptionIcon?.(transforms.getIconData?.(item) as TIconData),
      })),
  });

/**
 * Multi-select filter configuration
 */
export type TMultiSelectConfig<TValue extends TFilterValue = string> = TBaseFilterFieldConfig & {
  defaultValue?: TValue[];
  singleValueOperator: TSupportedOperators;
};

/**
 * Helper to get the multi select config
 * @param transforms - How to transform items into options
 * @param config - Multi-select specific configuration
 * @param iconConfig - Icon configuration for options
 * @returns The multi select config
 */
export const getMultiSelectConfig = <
  TItem,
  TValue extends TFilterValue = string,
  TIconData extends string | number | boolean | object | undefined = undefined,
>(
  transforms: TOptionTransforms<TItem, TValue, TIconData>,
  config: TMultiSelectConfig<TValue>,
  iconConfig?: IFilterIconConfig<TIconData>
) =>
  createFilterFieldConfig<typeof FILTER_FIELD_TYPE.MULTI_SELECT, TValue>({
    type: FILTER_FIELD_TYPE.MULTI_SELECT,
    ...config,
    operatorLabel: config?.operatorLabel,
    getOptions: () =>
      transforms.items.map((item) => ({
        id: transforms.getId(item),
        label: transforms.getLabel(item),
        value: transforms.getValue(item),
        icon: iconConfig?.getOptionIcon?.(transforms.getIconData?.(item) as TIconData),
      })),
  });

// ------------ Date filters ------------

/**
 * Date filter configuration
 */
export type TDateConfig = TBaseFilterFieldConfig & {
  min?: Date;
  max?: Date;
};

/**
 * Date range filter configuration
 */
export type TDateRangeConfig = TBaseFilterFieldConfig & {
  min?: Date;
  max?: Date;
};

/**
 * Helper to get the date picker config
 * @param config - Date-specific configuration
 * @returns The date picker config
 */
export const getDatePickerConfig = (config: TDateConfig) =>
  createFilterFieldConfig<typeof FILTER_FIELD_TYPE.DATE, Date>({
    type: FILTER_FIELD_TYPE.DATE,
    ...config,
  });

/**
 * Helper to get the date range picker config
 * @param config - Date range-specific configuration
 * @returns The date range picker config
 */
export const getDateRangePickerConfig = (config: TDateRangeConfig) =>
  createFilterFieldConfig<typeof FILTER_FIELD_TYPE.DATE_RANGE, Date>({
    type: FILTER_FIELD_TYPE.DATE_RANGE,
    ...config,
  });
