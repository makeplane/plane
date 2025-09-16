import { TFilterValue } from "../expression";
import {
  TDateFilterFieldConfig,
  TTextFilterFieldConfig,
  TNumberFilterFieldConfig,
  TBooleanFilterFieldConfig,
} from "../field-types";
import { EXTENDED_COMPARISON_OPERATOR } from "../operators";

// ----------------------------- EXACT Operator -----------------------------
export type TExtendedExactOperatorConfigs<V extends TFilterValue> =
  | TBooleanFilterFieldConfig
  | TNumberFilterFieldConfig<V>
  | TTextFilterFieldConfig<V>;

// ----------------------------- IN Operator -----------------------------
export type TExtendedInOperatorConfigs<_V extends TFilterValue> = never;

// ----------------------------- RANGE Operator -----------------------------
export type TExtendedRangeOperatorConfigs<_V extends TFilterValue> = never;

// ----------------------------- LT Operator -----------------------------
export type TLtOperatorConfigs<V extends TFilterValue> = TDateFilterFieldConfig<V> | TNumberFilterFieldConfig<V>;

// ----------------------------- LTE Operator -----------------------------
export type TLteOperatorConfigs<V extends TFilterValue> = TDateFilterFieldConfig<V> | TNumberFilterFieldConfig<V>;

// ----------------------------- GT Operator -----------------------------
export type TGtOperatorConfigs<V extends TFilterValue> = TDateFilterFieldConfig<V> | TNumberFilterFieldConfig<V>;

// ----------------------------- GTE Operator -----------------------------
export type TGteOperatorConfigs<V extends TFilterValue> = TDateFilterFieldConfig<V> | TNumberFilterFieldConfig<V>;

// ----------------------------- Extended Operator Specific Configs -----------------------------
export type TExtendedOperatorSpecificConfigs<V extends TFilterValue> = {
  [EXTENDED_COMPARISON_OPERATOR.LESS_THAN]: TLtOperatorConfigs<V>;
  [EXTENDED_COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL_TO]: TLteOperatorConfigs<V>;
  [EXTENDED_COMPARISON_OPERATOR.GREATER_THAN]: TGtOperatorConfigs<V>;
  [EXTENDED_COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL_TO]: TGteOperatorConfigs<V>;
};
