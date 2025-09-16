import { TFilterValue } from "../expression";
import {
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
} from "../field-types";
import { CORE_COLLECTION_OPERATOR, CORE_COMPARISON_OPERATOR, CORE_EQUALITY_OPERATOR } from "../operators";

// ----------------------------- EXACT Operator -----------------------------
export type TCoreExactOperatorConfigs<V extends TFilterValue> =
  | TSingleSelectFilterFieldConfig<V>
  | TDateFilterFieldConfig<V>;

// ----------------------------- IN Operator -----------------------------
export type TCoreInOperatorConfigs<V extends TFilterValue> = TMultiSelectFilterFieldConfig<V>;

// ----------------------------- RANGE Operator -----------------------------
export type TCoreRangeOperatorConfigs<V extends TFilterValue> = TDateRangeFilterFieldConfig<V>;

// ----------------------------- Core Operator Specific Configs -----------------------------
export type TCoreOperatorSpecificConfigs<V extends TFilterValue> = {
  [CORE_EQUALITY_OPERATOR.EXACT]: TCoreExactOperatorConfigs<V>;
  [CORE_COLLECTION_OPERATOR.IN]: TCoreInOperatorConfigs<V>;
  [CORE_COMPARISON_OPERATOR.RANGE]: TCoreRangeOperatorConfigs<V>;
};
