// plane imports
import { FilterAdapter } from "@plane/shared-state";
import {
  LOGICAL_OPERATOR,
  TAutomationConditionFilterExpressionData,
  TFilterExpression,
  TAutomationConditionFilterProperty,
  TAutomationConditionFilterExpression,
} from "@plane/types";
import {
  isAndGroupNode,
  isOrGroupNode,
  isNotGroupNode,
  isConditionNode,
  createConditionNode,
  createAndGroupNode,
  createOrGroupNode,
  createNotGroupNode,
} from "@plane/utils";

class AutomationConditionFilterAdapter extends FilterAdapter<
  TAutomationConditionFilterProperty,
  TAutomationConditionFilterExpression
> {
  toInternal(
    externalFilter: TAutomationConditionFilterExpression
  ): TFilterExpression<TAutomationConditionFilterProperty> | null {
    if (!externalFilter) return null;

    return this._convertExpressionToInternal(externalFilter);
  }

  private _convertExpressionToInternal(
    expression: TAutomationConditionFilterExpressionData
  ): TFilterExpression<TAutomationConditionFilterProperty> {
    // Check if it's a simple condition (has field property)
    if ("field" in expression) {
      return createConditionNode({
        property: expression.field,
        operator: expression.operator,
        value: expression.value,
      });
    }

    // It's a logical group - check which type
    if (LOGICAL_OPERATOR.AND in expression) {
      const conditions = expression[LOGICAL_OPERATOR.AND].map((item) => this._convertExpressionToInternal(item));
      return createAndGroupNode(conditions);
    }

    if (LOGICAL_OPERATOR.OR in expression) {
      const conditions = expression[LOGICAL_OPERATOR.OR].map((item) => this._convertExpressionToInternal(item));
      return createOrGroupNode(conditions);
    }

    if (LOGICAL_OPERATOR.NOT in expression) {
      const condition = this._convertExpressionToInternal(expression[LOGICAL_OPERATOR.NOT]);
      return createNotGroupNode(condition);
    }

    throw new Error("Invalid expression: unknown structure");
  }

  toExternal(
    internalFilter: TFilterExpression<TAutomationConditionFilterProperty>
  ): TAutomationConditionFilterExpression {
    if (!internalFilter) {
      return undefined;
    }

    return this._convertExpressionToExternal(internalFilter);
  }

  private _convertExpressionToExternal(
    expression: TFilterExpression<TAutomationConditionFilterProperty>
  ): TAutomationConditionFilterExpressionData {
    if (isConditionNode(expression)) {
      // Return simple condition
      return {
        field: expression.property,
        operator: expression.operator,
        value: expression.value,
      };
    } else {
      // It's a group node
      if (isNotGroupNode(expression)) {
        return {
          [LOGICAL_OPERATOR.NOT]: this._convertExpressionToExternal(expression.child),
        };
      } else if (isAndGroupNode(expression)) {
        return {
          [LOGICAL_OPERATOR.AND]: expression.children.map((child) => this._convertExpressionToExternal(child)),
        };
      } else if (isOrGroupNode(expression)) {
        return {
          [LOGICAL_OPERATOR.OR]: expression.children.map((child) => this._convertExpressionToExternal(child)),
        };
      }
    }

    throw new Error(`Unknown logical operator for expression: ${expression}`);
  }
}

export const automationConditionFilterAdapter = new AutomationConditionFilterAdapter();
