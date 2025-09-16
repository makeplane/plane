import { TFilterValue } from "../expression";
import {
  TBooleanFilterFieldConfig,
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
  TNumberFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TTextFilterFieldConfig,
} from "../field-types";
import { TExtendedOperatorSpecificConfigs, TOperatorSpecificConfigs } from "../operator-configs";
import { TCoreSupportedDateFilterOperators, TCoreSupportedSelectFilterOperators } from "./core";
import { TFilterOperatorHelper } from "./shared";

// -------- DATE FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support single date filter types.
 */
export type TExtendedSupportedSingleDateFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TExtendedOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TExtendedOperatorSpecificConfigs<V>,
    K,
    TDateFilterFieldConfig<V>
  >;
}[keyof TExtendedOperatorSpecificConfigs<V>];

/**
 * Union type representing all extended operators that support range date filter types.
 */
export type TExtendedSupportedRangeDateFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TExtendedOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TExtendedOperatorSpecificConfigs<V>,
    K,
    TDateRangeFilterFieldConfig<V>
  >;
}[keyof TExtendedOperatorSpecificConfigs<V>];

/**
 * Union type representing all extended operators that support date filter types.
 */
export type TExtendedSupportedDateFilterOperators<V extends TFilterValue = TFilterValue> =
  | TExtendedSupportedSingleDateFilterOperators<V>
  | TExtendedSupportedRangeDateFilterOperators<V>;

export type TExtendedAllAvailableDateFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  | `-${TCoreSupportedDateFilterOperators<V>}`
  | TExtendedSupportedDateFilterOperators<V>
  | `-${TExtendedSupportedDateFilterOperators<V>}`;

// -------- SELECT FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support single select filter types.
 */
export type TExtendedSupportedSingleSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TExtendedOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TExtendedOperatorSpecificConfigs<V>,
    K,
    TSingleSelectFilterFieldConfig<V>
  >;
}[keyof TExtendedOperatorSpecificConfigs<V>];

/**
 * Union type representing all extended operators that support multi select filter types.
 */
export type TExtendedSupportedMultiSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TExtendedOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TExtendedOperatorSpecificConfigs<V>,
    K,
    TMultiSelectFilterFieldConfig<V>
  >;
}[keyof TExtendedOperatorSpecificConfigs<V>];

/**
 * Union type representing all extended operators that support select filter types.
 */
export type TExtendedSupportedSelectFilterOperators<V extends TFilterValue = TFilterValue> =
  | TExtendedSupportedSingleSelectFilterOperators<V>
  | TExtendedSupportedMultiSelectFilterOperators<V>;

export type TExtendedAllAvailableSelectFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  | `-${TCoreSupportedSelectFilterOperators<V>}`
  | TExtendedSupportedSelectFilterOperators<V>
  | `-${TExtendedSupportedSelectFilterOperators<V>}`;

// -------- BOOLEAN FILTER OPERATORS --------

/**
 * Union type representing all operators that support boolean filter types.
 */
export type TExtendedSupportedBooleanFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TOperatorSpecificConfigs<V>,
    K,
    TBooleanFilterFieldConfig
  >;
}[keyof TOperatorSpecificConfigs<V>];

export type TExtendedAllAvailableBooleanFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  | TExtendedSupportedBooleanFilterOperators<V>
  | `-${TExtendedSupportedBooleanFilterOperators<V>}`;

// -------- NUMBER FILTER OPERATORS --------

/**
 * Union type representing all operators that support number filter types.
 */
export type TExtendedSupportedNumberFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TOperatorSpecificConfigs<V>,
    K,
    TNumberFilterFieldConfig<V>
  >;
}[keyof TOperatorSpecificConfigs<V>];

export type TExtendedAllAvailableNumberFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  | TExtendedSupportedNumberFilterOperators<V>
  | `-${TExtendedSupportedNumberFilterOperators<V>}`;

// -------- TEXT FILTER OPERATORS --------

/**
 * Union type representing all operators that support text filter types.
 */
export type TExtendedSupportedTextFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TOperatorSpecificConfigs<V>]: TFilterOperatorHelper<
    TOperatorSpecificConfigs<V>,
    K,
    TTextFilterFieldConfig<V>
  >;
}[keyof TOperatorSpecificConfigs<V>];

export type TExtendedAllAvailableTextFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  | TExtendedSupportedTextFilterOperators<V>
  | `-${TExtendedSupportedTextFilterOperators<V>}`;

// -------- COMPOSED SUPPORT TYPES --------

/**
 * All supported boolean filter operators (ee only).
 */
export type TSupportedBooleanFilterOperators<V extends TFilterValue = TFilterValue> =
  TExtendedSupportedBooleanFilterOperators<V>;

export type TAllAvailableBooleanFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TExtendedAllAvailableBooleanFilterOperatorsForDisplay<V>;

/**
 * All supported number filter operators (ee only).
 */
export type TSupportedNumberFilterOperators<V extends TFilterValue = TFilterValue> =
  TExtendedSupportedNumberFilterOperators<V>;

export type TAllAvailableNumberFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TExtendedAllAvailableNumberFilterOperatorsForDisplay<V>;

/**
 * All supported text filter operators (ee only).
 */
export type TSupportedTextFilterOperators<V extends TFilterValue = TFilterValue> =
  TExtendedSupportedTextFilterOperators<V>;

export type TAllAvailableTextFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TExtendedAllAvailableTextFilterOperatorsForDisplay<V>;
