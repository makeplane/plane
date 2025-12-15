import type { TFilterValue } from "../expression";
import type {
  TCoreAllAvailableDateFilterOperatorsForDisplay,
  TCoreAllAvailableSelectFilterOperatorsForDisplay,
  TCoreSupportedDateFilterOperators,
  TCoreSupportedSelectFilterOperators,
} from "./core";
import type {
  TExtendedAllAvailableDateFilterOperatorsForDisplay,
  TExtendedAllAvailableSelectFilterOperatorsForDisplay,
  TExtendedSupportedDateFilterOperators,
  TExtendedSupportedSelectFilterOperators,
} from "./extended";

// -------- COMPOSED SUPPORT TYPES --------

/**
 * All supported date filter operators.
 */
export type TSupportedDateFilterOperators<V extends TFilterValue = TFilterValue> =
  | TCoreSupportedDateFilterOperators<V>
  | TExtendedSupportedDateFilterOperators<V>;

export type TAllAvailableDateFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  | TCoreAllAvailableDateFilterOperatorsForDisplay<V>
  | TExtendedAllAvailableDateFilterOperatorsForDisplay<V>;

/**
 * All supported select filter operators.
 */
export type TSupportedSelectFilterOperators<V extends TFilterValue = TFilterValue> =
  | TCoreSupportedSelectFilterOperators<V>
  | TExtendedSupportedSelectFilterOperators<V>;

export type TAllAvailableSelectFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  | TCoreAllAvailableSelectFilterOperatorsForDisplay<V>
  | TExtendedAllAvailableSelectFilterOperatorsForDisplay<V>;

// -------- RE-EXPORTS --------

export * from "./shared";
export * from "./core";
export * from "./extended";
