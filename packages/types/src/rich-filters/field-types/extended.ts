import { SingleOrArray } from "../../utils";
import { TFilterValue } from "../expression";
import { TBaseFilterFieldConfig } from "./shared";

/**
 * Extended filter types
 */
export const EXTENDED_FILTER_FIELD_TYPE = {
  TEXT: "text",
  NUMBER: "number",
  BOOLEAN: "boolean",
} as const;

// -------- TEXT FILTER CONFIGURATIONS --------

/**
 * Text filter configuration - for string-based filtering.
 * - defaultValue: Initial value when filter is added
 */
export type TTextFilterFieldConfig<V extends TFilterValue> = TBaseFilterFieldConfig & {
  type: typeof EXTENDED_FILTER_FIELD_TYPE.TEXT;
  defaultValue?: SingleOrArray<V>;
};

// -------- NUMBER FILTER CONFIGURATIONS --------

/**
 * Numeric filter configuration - for number-based filtering.
 * - defaultValue: Initial value when filter is added
 * - min: Minimum allowed value for validation
 * - max: Maximum allowed value for validation
 */
export type TNumberFilterFieldConfig<V extends TFilterValue> = TBaseFilterFieldConfig & {
  type: typeof EXTENDED_FILTER_FIELD_TYPE.NUMBER;
  defaultValue?: SingleOrArray<V>;
  min?: number;
  max?: number;
};

// -------- BOOLEAN FILTER CONFIGURATIONS --------

/**
 * Boolean filter configuration - for true/false filtering.
 * - defaultValue: Initial value when filter is added
 */
export type TBooleanFilterFieldConfig = TBaseFilterFieldConfig & {
  type: typeof EXTENDED_FILTER_FIELD_TYPE.BOOLEAN;
  defaultValue?: boolean;
};

// -------- UNION TYPES --------

/**
 * All extended filter configurations
 */
export type TExtendedFilterFieldConfigs<V extends TFilterValue = TFilterValue> =
  | TTextFilterFieldConfig<V>
  | TNumberFilterFieldConfig<V>
  | TBooleanFilterFieldConfig;
