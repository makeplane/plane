import type { TFilterValue } from "../expression";

// -------- DATE FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support date filter types.
 */
export type TExtendedSupportedDateFilterOperators<_V extends TFilterValue = TFilterValue> = never;

export type TExtendedAllAvailableDateFilterOperatorsForDisplay<_V extends TFilterValue = TFilterValue> = never;

// -------- SELECT FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support select filter types.
 */
export type TExtendedSupportedSelectFilterOperators<_V extends TFilterValue = TFilterValue> = never;

export type TExtendedAllAvailableSelectFilterOperatorsForDisplay<_V extends TFilterValue = TFilterValue> = never;
