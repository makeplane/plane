import { TFilterValue } from "../expression";
import {
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
} from "../field-types";
import { TCoreOperatorSpecificConfigs } from "../operator-configs";
import { TFilterOperatorHelper } from "./shared";

// -------- DATE FILTER OPERATORS --------

/**
 * Union type representing all core operators that support single date filter types.
 */
export type TCoreSupportedSingleDateFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs<V>,
    K,
    TDateFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs<V>];

/**
 * Union type representing all core operators that support range date filter types.
 */
export type TCoreSupportedRangeDateFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs<V>,
    K,
    TDateRangeFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs<V>];

/**
 * Union type representing all core operators that support date filter types.
 */
export type TCoreSupportedDateFilterOperators<V extends TFilterValue = TFilterValue> =
  | TCoreSupportedSingleDateFilterOperators<V>
  | TCoreSupportedRangeDateFilterOperators<V>;

export type TCoreAllAvailableDateFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TCoreSupportedDateFilterOperators<V>;

// -------- SELECT FILTER OPERATORS --------

/**
 * Union type representing all core operators that support single select filter types.
 */
export type TCoreSupportedSingleSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs<V>,
    K,
    TSingleSelectFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs<V>];

/**
 * Union type representing all core operators that support multi select filter types.
 */
export type TCoreSupportedMultiSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs<V>,
    K,
    TMultiSelectFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs<V>];

/**
 * Union type representing all core operators that support any select filter types.
 */
export type TCoreSupportedSelectFilterOperators<V extends TFilterValue = TFilterValue> =
  | TCoreSupportedSingleSelectFilterOperators<V>
  | TCoreSupportedMultiSelectFilterOperators<V>;

export type TCoreAllAvailableSelectFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TCoreSupportedSelectFilterOperators<V>;
