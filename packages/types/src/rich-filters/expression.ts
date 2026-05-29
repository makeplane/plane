// local imports
import type { SingleOrArray } from "../utils";
import type { TSupportedOperators, LOGICAL_OPERATOR, TAllAvailableOperatorsForDisplay } from "./operators";

/**
 * Filter node types for building hierarchical filter trees.
 * - CONDITION: Single filter for one field (e.g., "state is backlog")
 * - GROUP: Logical container combining multiple filters with AND/OR or single filter/group with NOT
 */
export const FILTER_NODE_TYPE = {
  CONDITION: "condition",
  GROUP: "group",
} as const;
export type TFilterNodeType = (typeof FILTER_NODE_TYPE)[keyof typeof FILTER_NODE_TYPE];

/**
 * Field property key that can be filtered (e.g., "state", "assignee", "created_at").
 */
export type TFilterProperty = string;

/**
 * Allowed filter values - primitives plus null/undefined for empty states.
 */
export type TFilterValue = string | number | Date | boolean | null | undefined;

/**
 * Base properties shared by all filter nodes.
 * - id: Unique identifier for the node
 * - type: Node type (condition or group)
 */
type TBaseFilterNode = {
  id: string;
  type: TFilterNodeType;
};

/**
 * Leaf node representing a single filter condition (e.g., "state is backlog").
 * - type: Node type (condition)
 * - property: Field being filtered
 * - operator: Comparison operator (is, is not, between, not between, etc.)
 * - value: Filter value(s) - array for operators that support multiple values
 * @template P - Property key type
 * @template V - Value type
 */
export type TFilterConditionNode<P extends TFilterProperty, V extends TFilterValue> = TBaseFilterNode & {
  type: typeof FILTER_NODE_TYPE.CONDITION;
  property: P;
  operator: TSupportedOperators;
  value: SingleOrArray<V>;
};

/**
 * Filter condition node for display purposes.
 */
export type TFilterConditionNodeForDisplay<P extends TFilterProperty, V extends TFilterValue> = Omit<
  TFilterConditionNode<P, V>,
  "operator"
> & {
  operator: TAllAvailableOperatorsForDisplay;
};

/**
 * Container node that combines multiple conditions with AND logical operator.
 * - type: Node type (group)
 * - logicalOperator: AND operator for combining child filters
 * - children: Child conditions and/or nested groups (minimum 2 for meaningful operations)
 * @template P - Property key type
 */
export type TFilterAndGroupNode<P extends TFilterProperty> = TBaseFilterNode & {
  type: typeof FILTER_NODE_TYPE.GROUP;
  logicalOperator: typeof LOGICAL_OPERATOR.AND;
  children: TFilterExpression<P>[];
};

/**
 * Union type for all group node types - AND, OR, and NOT groups.
 * @template P - Property key type
 */
export type TFilterGroupNode<P extends TFilterProperty> = TFilterAndGroupNode<P>;

/**
 * Union type for any filter node - either a single condition or a group container.
 * @template P - Property key type
 * @template V - Value type
 */
export type TFilterExpression<P extends TFilterProperty, V extends TFilterValue = TFilterValue> =
  | TFilterConditionNode<P, V>
  | TFilterGroupNode<P>;

/**
 * Payload for creating/updating condition nodes - excludes base node properties.
 * @template P - Property key type
 * @template V - Value type
 */
export type TFilterConditionPayload<P extends TFilterProperty, V extends TFilterValue> = Omit<
  TFilterConditionNode<P, V>,
  keyof TBaseFilterNode
>;

/**
 * Payload for creating/updating AND group nodes - excludes base node properties.
 * @template P - Property key type
 */
export type TFilterAndGroupPayload<P extends TFilterProperty> = Omit<TFilterAndGroupNode<P>, keyof TBaseFilterNode>;

/**
 * Union payload type for creating/updating any group node - excludes base node properties.
 * @template P - Property key type
 */
export type TFilterGroupPayload<P extends TFilterProperty> = TFilterAndGroupPayload<P>;
