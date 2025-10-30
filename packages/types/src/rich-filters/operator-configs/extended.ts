import { TFilterValue } from "../expression";

// ----------------------------- EXACT Operator -----------------------------
export type TExtendedExactOperatorConfigs<_V extends TFilterValue> = never;

// ----------------------------- IN Operator -----------------------------
export type TExtendedInOperatorConfigs<_V extends TFilterValue> = never;

// ----------------------------- RANGE Operator -----------------------------
export type TExtendedRangeOperatorConfigs<_V extends TFilterValue> = never;

// ----------------------------- Extended Operator Specific Configs -----------------------------
export type TExtendedOperatorSpecificConfigs<_V extends TFilterValue> = unknown;
