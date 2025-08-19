import { action } from "mobx";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { DEFAULT_FILTER_EXPRESSION_OPTIONS, TExpressionOptions } from "@plane/constants";
import {
  FILTER_NODE_TYPE,
  IFilterAdapter,
  LOGICAL_OPERATOR,
  NEGATION_OPERATORS,
  NEGATION_TO_POSITIVE_OPERATOR_MAP,
  POSITIVE_TO_NEGATION_OPERATOR_MAP,
  ONE_TO_MANY_OPERATOR_MAP,
  MANY_TO_ONE_OPERATOR_MAP,
  TAllOperators,
  TFilterConditionNode,
  TFilterConditionPayload,
  TFilterExpression,
  TFilterGroupNode,
  TFilterValue,
  TLogicalOperator,
} from "@plane/types";

export interface IFilterInstanceHelper<FilterPropertyKey extends string, TExternalFilterType> {
  // initialization
  initializeExpression: (initialExpression?: TExternalFilterType) => TFilterExpression<FilterPropertyKey> | null;
  initializeExpressionOptions: (expressionOptions?: Partial<TExpressionOptions>) => TExpressionOptions;

  // node operations
  findNodeById: (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string
  ) => TFilterExpression<FilterPropertyKey> | null;
  findParentChain: (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string,
    currentPath?: TFilterGroupNode<FilterPropertyKey>[]
  ) => TFilterGroupNode<FilterPropertyKey>[] | null;
  findImmediateParent: (
    expression: TFilterExpression<FilterPropertyKey> | null,
    targetId: string
  ) => TFilterGroupNode<FilterPropertyKey> | null;

  // operator utilities
  isNegationOperator: (operator: TAllOperators) => boolean;
  getPositiveOperator: (negationOperator: TAllOperators) => TAllOperators;
  getNegativeOperator: (positiveOperator: TAllOperators) => TAllOperators;
  shouldUpgradeOperator: (operator: TAllOperators, valueCount: number) => boolean;
  shouldDowngradeOperator: (operator: TAllOperators, valueCount: number) => boolean;
  upgradeOperator: (operator: TAllOperators) => TAllOperators;
  downgradeOperator: (operator: TAllOperators) => TAllOperators;
  getOptimalOperatorForValue: (
    currentOperator: TAllOperators,
    value: TFilterValue,
    expression?: TFilterExpression<FilterPropertyKey>,
    conditionId?: string
  ) => TAllOperators;
  getValidOperatorsForValue: (allOperators: readonly TAllOperators[], value: TFilterValue) => TAllOperators[];
  getValidOperatorsForCondition: (
    condition: TFilterConditionNode<FilterPropertyKey>,
    allOperators: readonly TAllOperators[]
  ) => TAllOperators[];
  isMultiValueOperator: (operator: TAllOperators) => boolean;
  isSingleValueOperator: (operator: TAllOperators) => boolean;

  // group operations
  wrapInNotGroup: (conditionNode: TFilterConditionNode<FilterPropertyKey>) => TFilterGroupNode<FilterPropertyKey>;
  isDirectlyWrappedInNotGroup: (
    expression: TFilterExpression<FilterPropertyKey> | null,
    conditionId: string
  ) => boolean;
  unwrapFromNotGroup: (
    expression: TFilterExpression<FilterPropertyKey> | null,
    conditionId: string
  ) => TFilterExpression<FilterPropertyKey> | null;
  replaceNodeInExpression: (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string,
    replacement: TFilterExpression<FilterPropertyKey>
  ) => TFilterExpression<FilterPropertyKey>;
  restructureExpressionForOperatorChange: (
    expression: TFilterExpression<FilterPropertyKey> | null,
    conditionId: string,
    newOperator: TAllOperators,
    condition: TFilterConditionPayload<FilterPropertyKey>
  ) => TFilterExpression<FilterPropertyKey> | null;
  isGroupNegated: (group: TFilterGroupNode<FilterPropertyKey>) => boolean;
  // group utilities
  shouldUnwrapGroup: (group: TFilterGroupNode<FilterPropertyKey>, preserveNotGroups?: boolean) => boolean;
  unwrapGroupIfNeeded: (
    group: TFilterGroupNode<FilterPropertyKey>,
    preserveNotGroups?: boolean
  ) => TFilterExpression<FilterPropertyKey>;

  // extraction utilities
  extractConditions: (expression: TFilterExpression<FilterPropertyKey>) => TFilterConditionNode<FilterPropertyKey>[];
  extractConditionsWithDisplayOperators: (
    expression: TFilterExpression<FilterPropertyKey>
  ) => TFilterConditionNode<FilterPropertyKey>[];

  // node creation
  createConditionNode: (
    condition: TFilterConditionPayload<FilterPropertyKey>
  ) => TFilterConditionNode<FilterPropertyKey>;
  createGroupNode: (
    operator: TLogicalOperator,
    nodes: TFilterExpression<FilterPropertyKey>[]
  ) => TFilterGroupNode<FilterPropertyKey>;

  // expression manipulation
  addAndCondition: (
    expression: TFilterExpression<FilterPropertyKey> | null,
    condition: TFilterExpression<FilterPropertyKey>
  ) => TFilterExpression<FilterPropertyKey>;
  addOrCondition: (
    expression: TFilterExpression<FilterPropertyKey> | null,
    condition: TFilterExpression<FilterPropertyKey>
  ) => TFilterExpression<FilterPropertyKey>;
  updateNodeInExpression: (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string,
    updates: Partial<TFilterConditionPayload<FilterPropertyKey>>
  ) => void;
  removeNodeFromExpression: (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string
  ) => { expression: TFilterExpression<FilterPropertyKey> | null; shouldNotify: boolean };

  // notification utilities
  shouldNotifyChangeForExpression: (expression: TFilterExpression<FilterPropertyKey> | null) => boolean;
  shouldNotifyChangeForValue: (value: TFilterValue) => boolean;
}

export class FilterInstanceHelper<FilterPropertyKey extends string, TExternalFilterType>
  implements IFilterInstanceHelper<FilterPropertyKey, TExternalFilterType>
{
  private adapter: IFilterAdapter<FilterPropertyKey, TExternalFilterType>;

  constructor(adapter: IFilterAdapter<FilterPropertyKey, TExternalFilterType>) {
    this.adapter = adapter;
  }

  // ------------ initialization ------------

  /**
   * Initializes the filter expression.
   * @param initialExpression - The initial expression to initialize the filter with.
   * @returns The initialized filter expression.
   */
  initializeExpression = (initialExpression?: TExternalFilterType): TFilterExpression<FilterPropertyKey> | null => {
    if (!initialExpression) return null;
    return this.adapter.toInternal(initialExpression);
  };

  /**
   * Initializes the filter expression options.
   * @returns The initialized filter expression options.
   */
  initializeExpressionOptions = (expressionOptions?: Partial<TExpressionOptions>): TExpressionOptions => ({
    ...DEFAULT_FILTER_EXPRESSION_OPTIONS,
    ...expressionOptions,
  });

  // ------------ node operations ------------

  /**
   * Finds a node by its ID in the filter expression tree.
   * @param expression - The filter expression to search in.
   * @param targetId - The ID of the node to find.
   * @returns The found node or null if not found.
   */
  findNodeById = (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string
  ): TFilterExpression<FilterPropertyKey> | null => {
    if (expression.id === targetId) {
      return expression;
    }

    if (expression.type === FILTER_NODE_TYPE.GROUP) {
      for (const child of expression.children) {
        const found = this.findNodeById(child, targetId);
        if (found) return found;
      }
    }

    return null;
  };

  /**
   * Finds the parent chain of a given node ID in the filter expression tree.
   * @param expression - The filter expression to search in.
   * @param targetId - The ID of the node whose parent chain to find.
   * @param currentPath - Current path of parent nodes (used internally for recursion).
   * @returns Array of parent nodes from immediate parent to root, or null if not found.
   */
  findParentChain = (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string,
    currentPath: TFilterGroupNode<FilterPropertyKey>[] = []
  ): TFilterGroupNode<FilterPropertyKey>[] | null => {
    if (expression.type === FILTER_NODE_TYPE.GROUP) {
      // Check if any direct child has the target ID
      for (const child of expression.children) {
        if (child.id === targetId) {
          return [expression, ...currentPath];
        }
      }

      // Recursively search in child groups
      for (const child of expression.children) {
        if (child.type === FILTER_NODE_TYPE.GROUP) {
          const chain = this.findParentChain(child, targetId, [expression, ...currentPath]);
          if (chain) return chain;
        }
      }
    }

    return null;
  };

  /**
   * Finds the immediate parent node of a given node ID.
   * @param expression - The filter expression to find parent in.
   * @param targetId - The ID of the node whose parent to find.
   * @returns The immediate parent node or null if not found or if the target is the root.
   */
  findImmediateParent = (
    expression: TFilterExpression<FilterPropertyKey> | null,
    targetId: string
  ): TFilterGroupNode<FilterPropertyKey> | null => {
    if (!expression) return null;

    const parentChain = this.findParentChain(expression, targetId);
    return parentChain && parentChain.length > 0 ? parentChain[0] : null;
  };

  // ------------ operator utilities ------------

  /**
   * Checks if an operator is a negation operator.
   * @param operator - The operator to check.
   * @returns True if the operator is a negation operator, false otherwise.
   */
  isNegationOperator = (operator: TAllOperators): boolean =>
    (NEGATION_OPERATORS as readonly string[]).includes(operator);

  /**
   * Gets the positive counterpart of a negation operator.
   * @param negationOperator - The negation operator to convert.
   * @returns The positive operator or the original operator if not a negation operator.
   */
  getPositiveOperator = (negationOperator: TAllOperators): TAllOperators =>
    (NEGATION_TO_POSITIVE_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[negationOperator] || negationOperator;

  /**
   * Gets the negative counterpart of a positive operator.
   * @param positiveOperator - The positive operator to convert.
   * @returns The negative operator.
   */
  getNegativeOperator = (positiveOperator: TAllOperators): TAllOperators =>
    (POSITIVE_TO_NEGATION_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[positiveOperator] || positiveOperator;

  /**
   * Checks if an operator should be upgraded from single-value to multi-value based on value count.
   * @param operator - The current operator.
   * @param valueCount - The number of values.
   * @returns True if the operator should be upgraded.
   */
  shouldUpgradeOperator = (operator: TAllOperators, valueCount: number): boolean => {
    if (valueCount <= 1) return false;
    return Object.keys(ONE_TO_MANY_OPERATOR_MAP).includes(operator);
  };

  /**
   * Checks if an operator should be downgraded from multi-value to single-value based on value count.
   * @param operator - The current operator.
   * @param valueCount - The number of values.
   * @returns True if the operator should be downgraded.
   */
  shouldDowngradeOperator = (operator: TAllOperators, valueCount: number): boolean => {
    if (valueCount > 1) return false;
    return Object.keys(MANY_TO_ONE_OPERATOR_MAP).includes(operator);
  };

  /**
   * Upgrades a single-value operator to its multi-value equivalent.
   * @param operator - The operator to upgrade.
   * @returns The upgraded operator.
   */
  upgradeOperator = (operator: TAllOperators): TAllOperators =>
    (ONE_TO_MANY_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[operator] || operator;

  /**
   * Downgrades a multi-value operator to its single-value equivalent.
   * @param operator - The operator to downgrade.
   * @returns The downgraded operator.
   */
  downgradeOperator = (operator: TAllOperators): TAllOperators =>
    (MANY_TO_ONE_OPERATOR_MAP as Record<TAllOperators, TAllOperators>)[operator] || operator;

  /**
   * Gets the optimal operator for a given value, automatically upgrading or downgrading as needed.
   * @param currentOperator - The current operator.
   * @param value - The filter value.
   * @param expression - The full expression to check for NOT group context.
   * @param conditionId - The condition ID to check for NOT group context.
   * @returns The optimal operator for the given value.
   */
  getOptimalOperatorForValue = (
    currentOperator: TAllOperators,
    value: TFilterValue,
    expression?: TFilterExpression<FilterPropertyKey>,
    conditionId?: string
  ): TAllOperators => {
    const valueCount = Array.isArray(value) ? value.length : value !== null && value !== undefined ? 1 : 0;

    // Determine if condition is in NOT group context
    const isInNotGroup = expression && conditionId ? this.isDirectlyWrappedInNotGroup(expression, conditionId) : false;

    // Get the display operator (considering NOT group context)
    const displayOperator = isInNotGroup ? this.getNegativeOperator(currentOperator) : currentOperator;

    // Check if display operator needs upgrade/downgrade
    let optimalDisplayOperator = displayOperator;

    if (this.shouldUpgradeOperator(displayOperator, valueCount)) {
      optimalDisplayOperator = this.upgradeOperator(displayOperator);
    } else if (this.shouldDowngradeOperator(displayOperator, valueCount)) {
      optimalDisplayOperator = this.downgradeOperator(displayOperator);
    }

    // If no change needed, return current operator
    if (optimalDisplayOperator === displayOperator) {
      return currentOperator;
    }

    // Convert back to raw operator based on NOT group context
    return isInNotGroup ? this.getPositiveOperator(optimalDisplayOperator) : optimalDisplayOperator;
  };

  /**
   * Gets a list of operators that are valid for a given value.
   * @param allOperators - All possible operators.
   * @param value - The filter value.
   * @returns An array of operators that are valid for the given value.
   */
  getValidOperatorsForValue = (allOperators: readonly TAllOperators[], value: TFilterValue): TAllOperators[] => {
    const valueCount = Array.isArray(value) ? value.length : value !== null && value !== undefined ? 1 : 0;

    return allOperators.filter((operator) => {
      // For single value (0 or 1 items), show single-value operators (IS, IS_NOT)
      if (valueCount <= 1) {
        return this.isSingleValueOperator(operator) || this.isNegationOperator(operator);
      }

      // For multiple values, show multi-value operators (IN, NOT_IN)
      return this.isMultiValueOperator(operator);
    });
  };

  /**
   * Gets a list of operators that are valid for a specific condition.
   * @param condition - The condition node to check.
   * @param allOperators - All possible operators.
   * @returns An array of operators that are valid for the specific condition.
   */
  getValidOperatorsForCondition = (
    condition: TFilterConditionNode<FilterPropertyKey>,
    allOperators: readonly TAllOperators[]
  ): TAllOperators[] => {
    const valueCount = Array.isArray(condition.value)
      ? condition.value.length
      : condition.value !== null && condition.value !== undefined
        ? 1
        : 0;

    return allOperators.filter((operator) => {
      // For single value (0 or 1 items), show single-value operators (IS, IS_NOT)
      if (valueCount <= 1) {
        return this.isSingleValueOperator(operator);
      }

      // For multiple values, show multi-value operators (IN, NOT_IN)
      return this.isMultiValueOperator(operator);
    });
  };

  /**
   * Checks if an operator is a multi-value operator (IN, NOT_IN).
   * @param operator - The operator to check.
   * @returns True if the operator is a multi-value operator, false otherwise.
   */
  isMultiValueOperator = (operator: TAllOperators): boolean =>
    // Check if the operator is in the keys of MANY_TO_ONE_OPERATOR_MAP (IN, NOT_IN)
    Object.keys(MANY_TO_ONE_OPERATOR_MAP).includes(operator);

  /**
   * Checks if an operator is a single-value operator (IS, IS_NOT).
   * @param operator - The operator to check.
   * @returns True if the operator is a single-value operator, false otherwise.
   */
  isSingleValueOperator = (operator: TAllOperators): boolean =>
    // Check if the operator is in the keys of ONE_TO_MANY_OPERATOR_MAP (IS, IS_NOT)
    Object.keys(ONE_TO_MANY_OPERATOR_MAP).includes(operator);

  // ------------ group operations ------------

  /**
   * Wraps a condition node in a NOT group.
   * @param conditionNode - The condition node to wrap.
   * @returns A NOT group containing the condition.
   */
  wrapInNotGroup = (conditionNode: TFilterConditionNode<FilterPropertyKey>): TFilterGroupNode<FilterPropertyKey> =>
    this.createGroupNode(LOGICAL_OPERATOR.NOT, [conditionNode]);

  /**
   * Checks if a condition is directly wrapped in a NOT group.
   * @param expression - The filter expression to check in.
   * @param conditionId - The ID of the condition to check.
   * @returns True if the condition is directly wrapped in a NOT group, false otherwise.
   */
  isDirectlyWrappedInNotGroup = (
    expression: TFilterExpression<FilterPropertyKey> | null,
    conditionId: string
  ): boolean => {
    const immediateParent = this.findImmediateParent(expression, conditionId);
    return immediateParent !== null && this.isGroupNegated(immediateParent);
  };

  /**
   * Unwraps a condition from its NOT group parent and restructures the expression.
   * @param expression - The filter expression to operate on.
   * @param conditionId - The ID of the condition to unwrap.
   * @returns The updated expression after unwrapping, or null if no changes were made.
   */
  unwrapFromNotGroup = (
    expression: TFilterExpression<FilterPropertyKey> | null,
    conditionId: string
  ): TFilterExpression<FilterPropertyKey> | null => {
    if (!expression) return null;

    const immediateParent = this.findImmediateParent(expression, conditionId);
    if (!immediateParent || !this.isGroupNegated(immediateParent)) {
      return expression; // No unwrapping needed
    }

    // Find the condition node
    const conditionNode = this.findNodeById(expression, conditionId);
    if (!conditionNode || conditionNode.type !== FILTER_NODE_TYPE.CONDITION) {
      return expression;
    }

    // If the NOT group has only this condition, replace the entire NOT group with the condition
    if (immediateParent.children.length === 1) {
      return this.replaceNodeInExpression(expression, immediateParent.id, conditionNode);
    }

    // If the NOT group has multiple children, remove this condition from the group
    const updatedParent: TFilterGroupNode<FilterPropertyKey> = {
      ...immediateParent,
      children: immediateParent.children.filter((child) => child.id !== conditionId),
    };

    // Keep the NOT group structure with remaining children (don't unwrap)
    // The remaining children should stay negated
    return this.replaceNodeInExpression(expression, immediateParent.id, updatedParent);
  };

  /**
   * Replaces a node in the expression tree with another node.
   * @param expression - The expression tree to search in.
   * @param targetId - The ID of the node to replace.
   * @param replacement - The node to replace with.
   * @returns The updated expression tree.
   */
  replaceNodeInExpression = (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string,
    replacement: TFilterExpression<FilterPropertyKey>
  ): TFilterExpression<FilterPropertyKey> => {
    if (expression.id === targetId) {
      return replacement;
    }

    if (expression.type === FILTER_NODE_TYPE.GROUP) {
      return {
        ...expression,
        children: expression.children.map((child) =>
          child.id === targetId ? replacement : this.replaceNodeInExpression(child, targetId, replacement)
        ),
      };
    }

    return expression;
  };

  /**
   * Restructures the expression when a condition's operator changes between positive and negative.
   * @param expression - The filter expression to operate on.
   * @param conditionId - The ID of the condition being updated.
   * @param newOperator - The new operator for the condition.
   * @param condition - The condition payload with the new operator.
   * @returns The restructured expression.
   */
  restructureExpressionForOperatorChange = (
    expression: TFilterExpression<FilterPropertyKey> | null,
    conditionId: string,
    newOperator: TAllOperators,
    condition: TFilterConditionPayload<FilterPropertyKey>
  ): TFilterExpression<FilterPropertyKey> | null => {
    if (!expression) return null;

    const isNewOperatorNegation = this.isNegationOperator(newOperator);
    const isCurrentlyWrapped = this.isDirectlyWrappedInNotGroup(expression, conditionId);

    if (isNewOperatorNegation && !isCurrentlyWrapped) {
      // Convert negation operator to positive and wrap in NOT group
      const positiveOperator = this.getPositiveOperator(newOperator);
      const updatedCondition: TFilterConditionPayload<FilterPropertyKey> = {
        ...condition,
        operator: positiveOperator,
      };

      // Update the condition with positive operator
      this.updateNodeInExpression(expression, conditionId, updatedCondition);

      // Find the updated condition node and wrap it in NOT group
      const conditionNode = this.findNodeById(expression, conditionId) as TFilterConditionNode<FilterPropertyKey>;
      if (conditionNode) {
        const notGroup = this.wrapInNotGroup(conditionNode);
        return this.replaceNodeInExpression(expression, conditionId, notGroup);
      }
    } else if (!isNewOperatorNegation && isCurrentlyWrapped) {
      // Unwrap from NOT group and use positive operator directly
      const updatedCondition: TFilterConditionPayload<FilterPropertyKey> = {
        ...condition,
        operator: newOperator,
      };

      // Update the condition first
      this.updateNodeInExpression(expression, conditionId, updatedCondition);

      // Then unwrap from NOT group
      return this.unwrapFromNotGroup(expression, conditionId);
    } else {
      // No restructuring needed, just update the operator
      const finalOperator = isNewOperatorNegation ? this.getPositiveOperator(newOperator) : newOperator;
      const updatedCondition: TFilterConditionPayload<FilterPropertyKey> = {
        ...condition,
        operator: finalOperator,
      };

      this.updateNodeInExpression(expression, conditionId, updatedCondition);
      return expression;
    }

    return expression;
  };

  /**
   * Checks if a group node represents a negated operation.
   * @param group - The group node to check.
   * @returns True if the group is negated, false otherwise.
   */
  isGroupNegated = (group: TFilterGroupNode<FilterPropertyKey>): boolean =>
    group.logicalOperator === LOGICAL_OPERATOR.NOT;

  // ------------ group utilities ------------

  /**
   * Determines if a group should be unwrapped based on the number of children and group type.
   * @param group - The group node to check.
   * @param preserveNotGroups - Whether to preserve NOT groups even with single children.
   * @returns True if the group should be unwrapped, false otherwise.
   */
  shouldUnwrapGroup = (group: TFilterGroupNode<FilterPropertyKey>, preserveNotGroups: boolean = true): boolean => {
    // Never unwrap groups with multiple children
    if (group.children.length !== 1) {
      return false;
    }

    // If preserveNotGroups is true, don't unwrap NOT groups with single children
    if (preserveNotGroups && group.logicalOperator === LOGICAL_OPERATOR.NOT) {
      return false;
    }

    // Unwrap AND/OR groups with single children, and NOT groups if preserveNotGroups is false
    return true;
  };

  /**
   * Unwraps a group if it meets the unwrapping criteria, otherwise returns the group.
   * @param group - The group node to potentially unwrap.
   * @param preserveNotGroups - Whether to preserve NOT groups even with single children.
   * @returns The unwrapped child or the original group.
   */
  unwrapGroupIfNeeded = (
    group: TFilterGroupNode<FilterPropertyKey>,
    preserveNotGroups: boolean = true
  ): TFilterExpression<FilterPropertyKey> => {
    if (this.shouldUnwrapGroup(group, preserveNotGroups)) {
      return group.children[0];
    }
    return group;
  };

  // ------------ extraction utilities ------------

  /**
   * Extracts all conditions from a filter expression.
   * @param expression - The filter expression to extract conditions from.
   * @returns An array of filter conditions.
   */
  extractConditions = (expression: TFilterExpression<FilterPropertyKey>): TFilterConditionNode<FilterPropertyKey>[] => {
    if (expression.type === FILTER_NODE_TYPE.CONDITION) {
      return [expression];
    }
    return expression.children.flatMap((child) => this.extractConditions(child));
  };

  /**
   * Extracts all conditions from a filter expression, including their display operators (transformed based on NOT group context).
   * @param expression - The filter expression to extract conditions from.
   * @returns An array of filter conditions with their display operators.
   */
  extractConditionsWithDisplayOperators = (
    expression: TFilterExpression<FilterPropertyKey>
  ): TFilterConditionNode<FilterPropertyKey>[] => {
    // First extract all raw conditions
    const rawConditions = this.extractConditions(expression);

    // Transform operators based on immediate parent context
    return rawConditions.map((condition) => {
      const immediateParent = this.findImmediateParent(expression, condition.id);

      // If immediate parent is a NOT group, transform the operator
      if (immediateParent && this.isGroupNegated(immediateParent)) {
        const displayOperator = this.getNegativeOperator(condition.operator);
        return {
          ...condition,
          operator: displayOperator,
        };
      }

      // Otherwise, return the condition as-is
      return condition;
    });
  };

  // ------------ node creation ------------

  /**
   * Creates a condition node.
   * @param condition - The condition to create.
   * @returns The created condition node.
   */
  createConditionNode = action(
    (condition: TFilterConditionPayload<FilterPropertyKey>): TFilterConditionNode<FilterPropertyKey> => ({
      id: uuidv4(),
      type: FILTER_NODE_TYPE.CONDITION,
      ...condition,
    })
  );

  /**
   * Creates a group node.
   * @param operator - The logical operator to use for the group.
   * @param nodes - The nodes to add to the group.
   * @returns The created group node.
   */
  createGroupNode = action(
    (
      operator: TLogicalOperator,
      nodes: TFilterExpression<FilterPropertyKey>[]
    ): TFilterGroupNode<FilterPropertyKey> => ({
      id: uuidv4(),
      type: FILTER_NODE_TYPE.GROUP,
      logicalOperator: operator,
      children: nodes,
    })
  );

  // ------------ expression manipulation ------------

  /**
   * Adds an AND condition to the filter expression.
   * @param expression - The current filter expression.
   * @param condition - The condition to add.
   * @returns The updated filter expression.
   */
  addAndCondition = action(
    (
      expression: TFilterExpression<FilterPropertyKey> | null,
      condition: TFilterExpression<FilterPropertyKey>
    ): TFilterExpression<FilterPropertyKey> => {
      // if no expression, set the new condition
      if (!expression) {
        return condition;
      }
      // if the expression is a condition, convert it to an AND group
      if (expression.type === FILTER_NODE_TYPE.CONDITION) {
        return this.createGroupNode(LOGICAL_OPERATOR.AND, [expression, condition]);
      }
      // if the expression is a group, and the group is an AND group, add the new condition to the group
      if (expression.type === FILTER_NODE_TYPE.GROUP && expression.logicalOperator === LOGICAL_OPERATOR.AND) {
        expression.children.push(condition);
        return expression;
      }
      // if the expression is a group, and the group is an OR group, create a new AND group and add the new condition to it
      if (expression.type === FILTER_NODE_TYPE.GROUP && expression.logicalOperator === LOGICAL_OPERATOR.OR) {
        return this.createGroupNode(LOGICAL_OPERATOR.AND, [expression, condition]);
      }
      // Throw error for unexpected expression type
      console.error("Invalid expression type", expression);
      return expression;
    }
  );

  /**
   * Adds an OR condition to the filter expression.
   * @param expression - The current filter expression.
   * @param condition - The condition to add.
   * @returns The updated filter expression.
   */
  addOrCondition = action(
    (
      expression: TFilterExpression<FilterPropertyKey> | null,
      condition: TFilterExpression<FilterPropertyKey>
    ): TFilterExpression<FilterPropertyKey> => {
      // if no expression, set the new condition
      if (!expression) {
        return condition;
      }
      // if the expression is a condition, convert it to an OR group
      if (expression.type === FILTER_NODE_TYPE.CONDITION) {
        return this.createGroupNode(LOGICAL_OPERATOR.OR, [expression, condition]);
      }
      // if the expression is a group, and the group is an OR group, add the new condition to the group
      if (expression.type === FILTER_NODE_TYPE.GROUP && expression.logicalOperator === LOGICAL_OPERATOR.OR) {
        expression.children.push(condition);
        return expression;
      }
      // if the expression is a group, but not an OR group, create a new OR group and add the new condition to it
      if (expression.type === FILTER_NODE_TYPE.GROUP && expression.logicalOperator === LOGICAL_OPERATOR.AND) {
        return this.createGroupNode(LOGICAL_OPERATOR.OR, [expression, condition]);
      }
      // Throw error for unexpected expression type
      console.error("Invalid expression type", expression);
      return expression;
    }
  );

  /**
   * Updates a node in the filter expression.
   * @param expression - The filter expression to update.
   * @param targetId - The id of the node to update.
   * @param updates - The updates to apply to the node.
   */
  updateNodeInExpression = (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string,
    updates: Partial<TFilterConditionPayload<FilterPropertyKey>>
  ): void => {
    // if the expression is a condition, update the condition
    if (expression.id === targetId) {
      Object.assign(expression, updates);
      return;
    }
    // if the expression is a group, check if the group has the target id
    if (expression.type === FILTER_NODE_TYPE.GROUP) {
      expression.children.forEach((child) => this.updateNodeInExpression(child, targetId, updates));
    }
  };

  /**
   * Removes a node from the filter expression.
   * @param expression - The filter expression to remove the node from.
   * @param targetId - The id of the node to remove.
   * @returns An object containing the updated filter expression and whether to notify about the change.
   */
  removeNodeFromExpression = (
    expression: TFilterExpression<FilterPropertyKey>,
    targetId: string
  ): { expression: TFilterExpression<FilterPropertyKey> | null; shouldNotify: boolean } => {
    // if the expression is a condition and matches the target id
    if (expression.id === targetId) {
      // Check if we should notify based on the value
      const shouldNotify =
        expression.type === FILTER_NODE_TYPE.CONDITION ? this.shouldNotifyChangeForValue(expression.value) : true;
      return { expression: null, shouldNotify };
    }

    // if the expression is a group, check if the group has the target id
    if (expression.type === FILTER_NODE_TYPE.GROUP) {
      let groupShouldNotify = false;

      // Find and remove the target id from the children
      const newChildren: TFilterExpression<FilterPropertyKey>[] = [];

      for (const child of expression.children) {
        const result = this.removeNodeFromExpression(child, targetId);
        if (result.expression !== null) {
          newChildren.push(result.expression);
        }
        // Track if any removal should trigger notification
        if (result.shouldNotify) {
          groupShouldNotify = true;
        }
      }

      // if the group has no children, return null
      if (newChildren.length === 0) {
        return { expression: null, shouldNotify: groupShouldNotify };
      }

      // Create updated group with remaining children
      const updatedGroup: TFilterGroupNode<FilterPropertyKey> = {
        ...expression,
        children: newChildren,
      };

      // Use helper to determine if group should be unwrapped (preserving NOT groups)
      const finalExpression = this.unwrapGroupIfNeeded(updatedGroup, true);

      return {
        expression: finalExpression,
        shouldNotify: groupShouldNotify,
      };
    }

    return { expression, shouldNotify: false };
  };

  // ------------ notification utilities ------------

  /**
   * Determines whether to notify about a change based on the entire filter expression.
   * @param expression - The filter expression to check.
   * @returns True if we should notify, false otherwise.
   */
  shouldNotifyChangeForExpression = (expression: TFilterExpression<FilterPropertyKey> | null): boolean => {
    if (!expression) {
      return false;
    }

    // If it's a condition, check its value
    if (expression.type === FILTER_NODE_TYPE.CONDITION) {
      return this.shouldNotifyChangeForValue(expression.value);
    }

    // If it's a group, check if any of its children have meaningful values
    if (expression.type === FILTER_NODE_TYPE.GROUP) {
      return expression.children.some((child) => this.shouldNotifyChangeForExpression(child));
    }

    return false;
  };

  /**
   * Determines whether to notify about a change based on the filter value.
   * @param value - The filter value to check.
   * @returns True if we should notify, false otherwise.
   */
  shouldNotifyChangeForValue = (value: TFilterValue): boolean => {
    if (value === null || value === undefined) {
      return false;
    }

    // If it's an array, check if it's empty or contains only null/undefined values
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return false;
      }
      return value.some((v) => v !== null && v !== undefined);
    }

    return true;
  };
}
