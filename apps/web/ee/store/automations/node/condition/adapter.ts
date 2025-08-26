// plane imports
import {
  LOGICAL_OPERATOR,
  TAutomationConditionFilterExpression,
  TAutomationConditionFilterConfig,
  TFilterExpression,
  TFilterConditionNode,
  TAutomationConditionFilterKeys,
  TLogicalOperator,
} from "@plane/types";
// local imports
import { FilterAdapter } from "@/plane-web/store/rich-filters/adapter";

class AutomationConditionFilterAdapter extends FilterAdapter<
  TAutomationConditionFilterKeys,
  TAutomationConditionFilterExpression
> {
  toInternal(
    externalFilter: TAutomationConditionFilterExpression | null
  ): TFilterExpression<TAutomationConditionFilterKeys> | null {
    if (!externalFilter) return null;

    return this._convertExpressionToInternal(externalFilter);
  }

  private _convertExpressionToInternal(
    expression: TAutomationConditionFilterExpression
  ): TFilterExpression<TAutomationConditionFilterKeys> {
    // Get the first logical operator key and its value
    const logicalOperator = Object.keys(expression)[0] as TLogicalOperator;
    const value = expression[logicalOperator as keyof TAutomationConditionFilterExpression];

    if (!value) {
      throw new Error("Invalid expression: no value found for logical operator");
    }

    if (logicalOperator === LOGICAL_OPERATOR.NOT) {
      // NOT takes a single config or expression
      if ("field" in value) {
        // It's a config
        const config = value as TAutomationConditionFilterConfig;
        return this._createGroupNode(logicalOperator, [
          this._createConditionNode({
            property: config.field,
            operator: config.operator,
            value: Array.isArray(config.value) ? config.value : [config.value],
          }),
        ]);
      } else {
        // It's a nested expression
        return this._createGroupNode(logicalOperator, [
          this._convertExpressionToInternal(value as TAutomationConditionFilterExpression),
        ]);
      }
    } else {
      // AND/OR take arrays
      const arrayValue = value as (TAutomationConditionFilterConfig | TAutomationConditionFilterExpression)[];
      const conditions = arrayValue.map((item) => {
        if ("field" in item) {
          // It's a config
          const config = item as TAutomationConditionFilterConfig;
          return this._createConditionNode({
            property: config.field,
            operator: config.operator,
            value: Array.isArray(config.value) ? config.value : [config.value],
          });
        } else {
          // It's a nested expression
          return this._convertExpressionToInternal(item as TAutomationConditionFilterExpression);
        }
      });

      return this._createGroupNode(logicalOperator, conditions);
    }
  }

  toExternal(internalFilter: TFilterExpression<TAutomationConditionFilterKeys>): TAutomationConditionFilterExpression {
    if (!internalFilter) {
      return this._createEmptyExpression();
    }

    return this._convertExpressionToExternal(internalFilter);
  }

  private _createEmptyExpression(): TAutomationConditionFilterExpression {
    return {
      [LOGICAL_OPERATOR.AND]: [],
    };
  }

  private _convertExpressionToExternal(
    expression: TFilterExpression<TAutomationConditionFilterKeys>
  ): TAutomationConditionFilterExpression {
    if (expression.type === "condition") {
      // Convert single condition to AND group with one condition
      return {
        [LOGICAL_OPERATOR.AND]: [
          {
            field: expression.property,
            operator: expression.operator,
            value: expression.value,
          },
        ],
      };
    } else {
      // It's a group node
      if (expression.logicalOperator === LOGICAL_OPERATOR.NOT) {
        // NOT takes a single value, not an array
        const firstChild = expression.children[0];
        if (firstChild.type === "condition") {
          const conditionChild = firstChild as TFilterConditionNode<TAutomationConditionFilterKeys>;
          return {
            [LOGICAL_OPERATOR.NOT]: {
              field: conditionChild.property,
              operator: conditionChild.operator,
              value: conditionChild.value,
            },
          };
        } else {
          return {
            [LOGICAL_OPERATOR.NOT]: this._convertExpressionToExternal(firstChild),
          };
        }
      } else {
        // AND/OR take arrays
        const children = expression.children.map((child) => {
          if (child.type === "condition") {
            const conditionChild = child as TFilterConditionNode<TAutomationConditionFilterKeys>;
            return {
              field: conditionChild.property,
              operator: conditionChild.operator,
              value: conditionChild.value,
            };
          } else {
            return this._convertExpressionToExternal(child);
          }
        });

        if (expression.logicalOperator === LOGICAL_OPERATOR.AND) {
          return {
            [LOGICAL_OPERATOR.AND]: children,
          };
        } else {
          return {
            [LOGICAL_OPERATOR.OR]: children,
          };
        }
      }
    }
  }
}

export const automationConditionFilterAdapter = new AutomationConditionFilterAdapter();
