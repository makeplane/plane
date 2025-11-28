import type { TFilterValue } from "../expression";
import type { TSupportedOperators } from "../operators";
import type { TBaseFilterFieldConfig, IFilterOption } from "./shared";

/**
 * Core filter types
 */
export const CORE_FILTER_FIELD_TYPE = {
  DATE: "date",
  DATE_RANGE: "date_range",
  SINGLE_SELECT: "single_select",
  MULTI_SELECT: "multi_select",
} as const;

// -------- DATE FILTER CONFIGURATIONS --------

type TBaseDateFilterFieldConfig = TBaseFilterFieldConfig & {
  min?: Date;
  max?: Date;
};

/**
 * Date filter configuration - for temporal filtering.
 * - defaultValue: Initial date/time value
 * - min: Minimum allowed date
 * - max: Maximum allowed date
 */
export type TDateFilterFieldConfig<V extends TFilterValue> = TBaseDateFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.DATE;
  defaultValue?: V;
};

/**
 * Date range filter configuration - for temporal filtering.
 * - defaultValue: Initial date/time range values
 * - min: Minimum allowed date
 * - max: Maximum allowed date
 */
export type TDateRangeFilterFieldConfig<V extends TFilterValue> = TBaseDateFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.DATE_RANGE;
  defaultValue?: V[];
};

// -------- SELECT FILTER CONFIGURATIONS --------

/**
 * Single-select filter configuration - dropdown with one selectable option.
 * - defaultValue: Initial selected value
 * - getOptions: Options as static array or async function
 */
export type TSingleSelectFilterFieldConfig<V extends TFilterValue> = TBaseFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.SINGLE_SELECT;
  defaultValue?: V;
  getOptions: IFilterOption<V>[] | (() => IFilterOption<V>[] | Promise<IFilterOption<V>[]>);
};

/**
 * Multi-select filter configuration - allows selecting multiple options.
 * - defaultValue: Initial selected values array
 * - getOptions: Options as static array or async function
 * - singleValueOperator: Operator to show when single value is selected
 */
export type TMultiSelectFilterFieldConfig<V extends TFilterValue> = TBaseFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.MULTI_SELECT;
  defaultValue?: V[];
  getOptions: IFilterOption<V>[] | (() => IFilterOption<V>[] | Promise<IFilterOption<V>[]>);
  singleValueOperator: TSupportedOperators;
};

// -------- UNION TYPES --------

/**
 * All core filter configurations
 */
export type TCoreFilterFieldConfigs<V extends TFilterValue = TFilterValue> =
  | TDateFilterFieldConfig<V>
  | TDateRangeFilterFieldConfig<V>
  | TSingleSelectFilterFieldConfig<V>
  | TMultiSelectFilterFieldConfig<V>;
