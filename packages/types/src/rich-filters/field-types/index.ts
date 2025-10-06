import { TFilterValue } from "../expression";
import { CORE_FILTER_FIELD_TYPE, TCoreFilterFieldConfigs } from "./core";
import { EXTENDED_FILTER_FIELD_TYPE, TExtendedFilterFieldConfigs } from "./extended";

// -------- COMPOSED FILTER TYPES --------

export const FILTER_FIELD_TYPE = {
  ...CORE_FILTER_FIELD_TYPE,
  ...EXTENDED_FILTER_FIELD_TYPE,
} as const;

export type TFilterFieldType = (typeof FILTER_FIELD_TYPE)[keyof typeof FILTER_FIELD_TYPE];

// -------- COMPOSED CONFIGURATIONS --------

/**
 * All supported filter configurations.
 */
export type TSupportedFilterFieldConfigs<V extends TFilterValue = TFilterValue> =
  | TCoreFilterFieldConfigs<V>
  | TExtendedFilterFieldConfigs<V>;

// -------- RE-EXPORTS --------

export * from "./shared";
export * from "./core";
export * from "./extended";
