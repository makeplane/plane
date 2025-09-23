import { FilterAdapter } from "@plane/shared-state";
import {
  COLLECTION_OPERATOR,
  EQUALITY_OPERATOR,
  EXTERNAL_WIDGET_OPERATOR_SEPARATOR,
  LOGICAL_OPERATOR,
  SingleOrArray,
  TSupportedOperators,
  TDashboardWidgetFilterKeys,
  TExternalDashboardWidgetFilterExpression,
  TExternalDashboardWidgetFilterExpressionData,
  TFilterExpression,
  TFilterValue,
  TInternalDashboardWidgetFilterExpression,
  TLogicalOperator,
} from "@plane/types";
import {
  createAndGroupNode,
  createConditionNode,
  createNotGroupNode,
  createOrGroupNode,
  isAndGroupNode,
  isConditionNode,
  isNotGroupNode,
  isOrGroupNode,
} from "@plane/utils";

export const createExternalFilterKey = (params: {
  property: string;
  operator: TSupportedOperators;
  value: TFilterValue;
}): { [key: string]: TFilterValue } => {
  const { property, operator, value } = params;

  const suffix = operator === COLLECTION_OPERATOR.IN ? EXTERNAL_WIDGET_OPERATOR_SEPARATOR + "in" : "";
  const externalKey = property + suffix;

  return {
    [externalKey]: Array.isArray(value) ? value.join(",") : value,
  };
};

export class DashboardWidgetFilterAdapter extends FilterAdapter<
  TDashboardWidgetFilterKeys,
  TExternalDashboardWidgetFilterExpression
> {
  toInternal(
    externalFilter: TExternalDashboardWidgetFilterExpression | null
  ): TInternalDashboardWidgetFilterExpression | null {
    if (!externalFilter || Object.keys(externalFilter).length === 0) return null;
    return this._convertExpressionToInternal(externalFilter);
  }

  toExternal(
    internalFilter: TFilterExpression<TDashboardWidgetFilterKeys> | null
  ): TExternalDashboardWidgetFilterExpression {
    if (!internalFilter) {
      return this._createEmptyExpression();
    }
    const externalFilter = this._convertExpressionToExternal(internalFilter);
    return externalFilter ?? this._createEmptyExpression();
  }

  protected _createEmptyExpression(): TExternalDashboardWidgetFilterExpression {
    return {};
  }

  private _getOperatorAndField(key: string): { operator: TSupportedOperators; key: string } {
    const operator = key.split(EXTERNAL_WIDGET_OPERATOR_SEPARATOR)[1] || EQUALITY_OPERATOR.EXACT;
    const field = key.split(EXTERNAL_WIDGET_OPERATOR_SEPARATOR)[0];

    return { operator: operator as TSupportedOperators, key: field };
  }

  private _parseFilterValue(value: SingleOrArray<TFilterValue>): SingleOrArray<TFilterValue> {
    let parsedValue: SingleOrArray<TFilterValue>;
    if (typeof value === "string" && value.includes(",")) {
      parsedValue = value.split(",") as unknown as SingleOrArray<TFilterValue>;
    } else {
      parsedValue = value;
    }

    return parsedValue;
  }

  private _convertExpressionToInternal(
    expression: TExternalDashboardWidgetFilterExpressionData
  ): TInternalDashboardWidgetFilterExpression {
    const expressionOperator = Object.keys(expression)[0];
    if (!Object.values(LOGICAL_OPERATOR).includes(expressionOperator as TLogicalOperator)) {
      // It's a condition node
      const { operator, key } = this._getOperatorAndField(expressionOperator);
      const value = expression[expressionOperator as keyof TExternalDashboardWidgetFilterExpressionData];

      // array values will be comma separated in the external filter
      const parsedValue = this._parseFilterValue(value);

      return createConditionNode({
        property: key as TDashboardWidgetFilterKeys,
        operator: operator,
        value: parsedValue,
      });
    }

    // It's a logical group - check which type
    if (LOGICAL_OPERATOR.AND in expression) {
      const conditions = expression[LOGICAL_OPERATOR.AND].map((item) =>
        this._convertExpressionToInternal(item as TExternalDashboardWidgetFilterExpressionData)
      );
      return createAndGroupNode(conditions);
    }

    if (LOGICAL_OPERATOR.OR in expression) {
      const conditions = expression[LOGICAL_OPERATOR.OR].map((item) =>
        this._convertExpressionToInternal(item as TExternalDashboardWidgetFilterExpressionData)
      );
      return createOrGroupNode(conditions);
    }

    if (LOGICAL_OPERATOR.NOT in expression) {
      const condition = this._convertExpressionToInternal(
        expression[LOGICAL_OPERATOR.NOT] as TExternalDashboardWidgetFilterExpressionData
      );
      return createNotGroupNode(condition);
    }

    throw new Error("Invalid expression: unknown structure");
  }

  private _convertExpressionToExternal(
    expression: TInternalDashboardWidgetFilterExpression
  ): TExternalDashboardWidgetFilterExpression {
    if (isConditionNode(expression)) {
      return createExternalFilterKey({
        property: expression.property,
        operator: expression.operator,
        value: expression.value as TFilterValue,
      });
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
