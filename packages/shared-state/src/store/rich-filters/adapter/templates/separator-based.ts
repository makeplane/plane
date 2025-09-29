// plane imports
import {
  COLLECTION_OPERATOR,
  EQUALITY_OPERATOR,
  LOGICAL_OPERATOR,
  SingleOrArray,
  TSupportedOperators,
  TFilterExpression,
  TFilterValue,
  TLogicalOperator,
  TFilterProperty,
  TExternalFilter,
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
import { FilterAdapter } from "../adapter";

/**
 * Configuration for separator-based filter adapters
 */
export interface SeparatorBasedConfig {
  /** The separator used to distinguish operators in external keys (e.g., "__in", "__exact") */
  operatorSeparator: string;
  /** The default operator to use when no separator is found */
  defaultOperator?: TSupportedOperators;
  /** Whether to handle array values as comma-separated strings in external format */
  handleArrayAsCommaSeparated?: boolean;
}

/**
 * Base template for adapters that use a simple separator based external format
 * where the key contains the property and operator separated by a delimiter
 */
export abstract class SeparatorBasedFilterAdapter<
  K extends TFilterProperty,
  E extends TExternalFilter,
> extends FilterAdapter<K, E> {
  protected abstract config: SeparatorBasedConfig;

  toInternal(externalFilter: E): TFilterExpression<K> | null {
    if (!externalFilter || Object.keys(externalFilter).length === 0) return null;
    return this._convertExpressionToInternal(externalFilter as Record<string, unknown>);
  }

  toExternal(internalFilter: TFilterExpression<K> | null): E {
    if (!internalFilter) {
      return this._createEmptyExpression();
    }
    const externalFilter = this._convertExpressionToExternal(internalFilter);
    return externalFilter ?? this._createEmptyExpression();
  }

  protected abstract _createEmptyExpression(): E;

  private _getOperatorAndField(key: string): { operator: TSupportedOperators; key: string } {
    const operator =
      key.split(this.config.operatorSeparator)[1] || this.config.defaultOperator || EQUALITY_OPERATOR.EXACT;
    const field = key.split(this.config.operatorSeparator)[0];

    return { operator: operator as TSupportedOperators, key: field };
  }

  private _parseFilterValue(value: SingleOrArray<TFilterValue>): SingleOrArray<TFilterValue> {
    if (!this.config.handleArrayAsCommaSeparated) return value;

    let parsedValue: SingleOrArray<TFilterValue>;
    if (typeof value === "string" && value.includes(",")) {
      parsedValue = value.split(",") as unknown as SingleOrArray<TFilterValue>;
    } else {
      parsedValue = value;
    }

    return parsedValue;
  }

  private _createExternalFilterKey(params: { property: string; operator: TSupportedOperators; value: TFilterValue }): {
    [key: string]: TFilterValue;
  } {
    const { property, operator, value } = params;

    const suffix = operator === COLLECTION_OPERATOR.IN ? this.config.operatorSeparator + "in" : "";
    const externalKey = property + suffix;

    return {
      [externalKey]: this.config.handleArrayAsCommaSeparated && Array.isArray(value) ? value.join(",") : value,
    };
  }

  private _convertExpressionToInternal(expression: Record<string, unknown>): TFilterExpression<K> {
    const expressionOperator = Object.keys(expression)[0];
    if (!Object.values(LOGICAL_OPERATOR).includes(expressionOperator as TLogicalOperator)) {
      // It's a condition node
      const { operator, key } = this._getOperatorAndField(expressionOperator);
      const value = expression[expressionOperator];

      // array values will be comma separated in the external filter
      const parsedValue = this._parseFilterValue(value as SingleOrArray<TFilterValue>);

      return createConditionNode({
        property: key as K,
        operator: operator,
        value: parsedValue,
      });
    }

    // It's a logical group - check which type
    if (LOGICAL_OPERATOR.AND in expression) {
      const conditions = (expression[LOGICAL_OPERATOR.AND] as Record<string, unknown>[]).map((item) =>
        this._convertExpressionToInternal(item)
      );
      return createAndGroupNode(conditions);
    }

    if (LOGICAL_OPERATOR.OR in expression) {
      const conditions = (expression[LOGICAL_OPERATOR.OR] as Record<string, unknown>[]).map((item) =>
        this._convertExpressionToInternal(item)
      );
      return createOrGroupNode(conditions);
    }

    if (LOGICAL_OPERATOR.NOT in expression) {
      const condition = this._convertExpressionToInternal(expression[LOGICAL_OPERATOR.NOT] as Record<string, unknown>);
      return createNotGroupNode(condition);
    }

    throw new Error("Invalid expression: unknown structure");
  }

  private _convertExpressionToExternal(expression: TFilterExpression<K>): E {
    if (isConditionNode(expression)) {
      return this._createExternalFilterKey({
        property: expression.property,
        operator: expression.operator,
        value: expression.value as TFilterValue,
      }) as unknown as E;
    } else {
      // It's a group node
      if (isNotGroupNode(expression)) {
        return {
          [LOGICAL_OPERATOR.NOT]: this._convertExpressionToExternal(expression.child),
        } as unknown as E;
      } else if (isAndGroupNode(expression)) {
        return {
          [LOGICAL_OPERATOR.AND]: expression.children.map((child) => this._convertExpressionToExternal(child)),
        } as unknown as E;
      } else if (isOrGroupNode(expression)) {
        return {
          [LOGICAL_OPERATOR.OR]: expression.children.map((child) => this._convertExpressionToExternal(child)),
        } as unknown as E;
      }
    }

    throw new Error(`Unknown logical operator for expression: ${expression}`);
  }
}
