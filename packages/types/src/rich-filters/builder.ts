import { SingleOrArray } from "../utils";
import { IFilterAdapter, TExternalFilter } from "./adapter";
import { TFilterProperty, TFilterValue } from "./expression";
import { TAllAvailableOperatorsForDisplay } from "./operators";

/**
 * Condition payload for building filter expressions.
 * @template P - Property key type
 * @template V - Value type
 */
export type TFilterConditionForBuild<P extends TFilterProperty, V extends TFilterValue> = {
  property: P;
  operator: TAllAvailableOperatorsForDisplay;
  value: SingleOrArray<V>;
};

/**
 * Parameters for building filter expressions from multiple conditions.
 * @template P - Property key type
 * @template V - Value type
 */
export type TBuildFilterExpressionParams<
  P extends TFilterProperty,
  V extends TFilterValue,
  E extends TExternalFilter,
> = {
  conditions: TFilterConditionForBuild<P, V>[];
  adapter: IFilterAdapter<P, E>;
};
