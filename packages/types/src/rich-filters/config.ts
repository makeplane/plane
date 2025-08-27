import { SingleOrArray } from "../utils";
import { FILTER_TYPE, TFilterProperty, TFilterType, TFilterValue } from "./base";
import {
  TAllOperators,
  TBooleanOperators,
  TDateOperators,
  TMultiSelectOperators,
  TNumberOperators,
  TSelectOperators,
  TTextOperators,
} from "./operator";

/**
 * Individual option for select/multi-select filters.
 * - id: Unique identifier for the option
 * - label: Display text shown to users
 * - value: Actual value used in filtering
 * - icon: Optional icon component
 * - iconClassName: CSS class for icon styling
 * - disabled: Whether option can be selected
 * - description: Additional context to be displayed in the filter dropdown
 */
export interface TFilterOption<V extends TFilterValue> {
  id: string;
  label: string;
  value: V;
  icon?: React.ReactNode;
  iconClassName?: string;
  disabled?: boolean;
  description?: string;
}

/**
 * Base configuration shared by all filter types.
 * - id: Field name that matches the filter property
 * - label: Human-readable name displayed in UI
 * - type: Filter type that determines available operators
 * - icon: Optional icon for the filter
 * - placeholder: Placeholder text for input fields
 * - isEnabled: Controls filter availability in UI
 * - customOperators: Override default operators for this filter config
 */
export interface TBaseFilterConfig<P extends TFilterProperty> {
  id: P;
  label: string;
  type: TFilterType;
  icon?: React.FC<React.SVGAttributes<SVGElement>>;
  placeholder?: string;
  isEnabled: boolean;
  customOperators?: TAllOperators[];
}

/**
 * Text filter configuration - for string-based filtering.
 * - defaultOperator: Default operator applied when filter is created
 * - defaultValue: Initial value when filter is added
 */
export interface TTextFilterConfig<P extends TFilterProperty, V extends TFilterValue> extends TBaseFilterConfig<P> {
  type: typeof FILTER_TYPE.TEXT;
  defaultOperator: TTextOperators;
  defaultValue?: SingleOrArray<V>;
}

/**
 * Numeric filter configuration - for number-based filtering.
 * - defaultOperator: Default operator applied when filter is created
 * - defaultValue: Initial value when filter is added
 * - min: Minimum allowed value for validation
 * - max: Maximum allowed value for validation
 */
export interface TNumberFilterConfig<P extends TFilterProperty, V extends TFilterValue> extends TBaseFilterConfig<P> {
  type: typeof FILTER_TYPE.NUMBER;
  defaultOperator: TNumberOperators;
  defaultValue?: SingleOrArray<V>;
  min?: number;
  max?: number;
}

/**
 * Boolean filter configuration - for true/false filtering.
 * - defaultOperator: Default operator applied when filter is created
 * - defaultValue: Initial value when filter is added
 */
export interface TBooleanFilterConfig<P extends TFilterProperty> extends TBaseFilterConfig<P> {
  type: typeof FILTER_TYPE.BOOLEAN;
  defaultOperator: TBooleanOperators;
  defaultValue?: boolean;
}

/**
 * Single-select filter configuration - dropdown with one selectable option.
 * - defaultOperator: Default comparison operator
 * - defaultValue: Initial selected value
 * - getOptions: Options as static array or async function
 */
export interface TSelectFilterConfig<P extends TFilterProperty, V extends TFilterValue> extends TBaseFilterConfig<P> {
  type: typeof FILTER_TYPE.SELECT;
  defaultOperator: TSelectOperators;
  defaultValue?: V;
  getOptions: TFilterOption<V>[] | (() => TFilterOption<V>[] | Promise<TFilterOption<V>[]>);
}

/**
 * Multi-select filter configuration - allows selecting multiple options.
 * - defaultOperator: Default comparison operator (usually 'in')
 * - defaultValue: Initial selected values array
 * - getOptions: Options as static array or async function
 */
export interface TMultiSelectFilterConfig<P extends TFilterProperty, V extends TFilterValue>
  extends TBaseFilterConfig<P> {
  type: typeof FILTER_TYPE.MULTI_SELECT;
  defaultOperator: TMultiSelectOperators;
  defaultValue?: V[];
  getOptions: TFilterOption<V>[] | (() => TFilterOption<V>[] | Promise<TFilterOption<V>[]>);
}

/**
 * Date filter configuration - for temporal filtering.
 * - defaultOperator: Default temporal operator
 * - defaultValue: Initial date/time value
 */
export interface TDateFilterConfig<P extends TFilterProperty, V extends TFilterValue> extends TBaseFilterConfig<P> {
  type: typeof FILTER_TYPE.DATE;
  defaultOperator: TDateOperators;
  defaultValue?: SingleOrArray<V>;
}

/**
 * Union type for all possible filter configurations.
 */
export type TFilterConfig<P extends TFilterProperty, V extends TFilterValue = TFilterValue> =
  | TTextFilterConfig<P, V>
  | TNumberFilterConfig<P, V>
  | TBooleanFilterConfig<P>
  | TSelectFilterConfig<P, V>
  | TMultiSelectFilterConfig<P, V>
  | TDateFilterConfig<P, V>;

/**
 * Base parameters for filter config factory functions.
 * - isEnabled: Controls filter availability in UI.
 */
export type TCreateFilterConfigParams = {
  isEnabled: boolean;
};

/**
 * Icon configuration for filters and their options.
 * - filterIcon: Optional icon for the filter
 * - getOptionIcon: Function to get icon for specific option values
 */
export type TFilterIconConfig<T extends string | number | boolean | object | undefined = undefined> = {
  filterIcon?: React.FC<React.SVGAttributes<SVGElement>>;
  getOptionIcon?: (value: T) => React.ReactNode;
};

/**
 * Factory function signature for creating filter configurations.
 */
export type TCreateFilterConfig<P extends TFilterProperty, T> = (params: T) => TFilterConfig<P>;
