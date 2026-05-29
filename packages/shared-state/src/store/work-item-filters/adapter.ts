// plane imports
import { isEmpty } from "lodash-es";
import type {
  SingleOrArray,
  TFilterExpression,
  TFilterValue,
  TSupportedOperators,
  TWorkItemFilterConditionData,
  TWorkItemFilterConditionKey,
  TWorkItemFilterExpression,
  TWorkItemFilterExpressionData,
  TWorkItemFilterProperty,
} from "@plane/types";
import { LOGICAL_OPERATOR, MULTI_VALUE_OPERATORS, WORK_ITEM_FILTER_PROPERTY_KEYS } from "@plane/types";
import { createConditionNode, createAndGroupNode, isAndGroupNode, isConditionNode } from "@plane/utils";
// local imports
import { FilterAdapter } from "../rich-filters/adapter";

class WorkItemFiltersAdapter extends FilterAdapter<TWorkItemFilterProperty, TWorkItemFilterExpression> {
  /**
   * Converts external work item filter expression to internal filter tree
   * @param externalFilter - The external filter expression
   * @returns Internal filter expression or null
   */
  toInternal(externalFilter: TWorkItemFilterExpression): TFilterExpression<TWorkItemFilterProperty> | null {
    if (!externalFilter || isEmpty(externalFilter)) return null;

    try {
      return this._convertExpressionToInternal(externalFilter);
    } catch (error) {
      console.error("Failed to convert external filter to internal:", error);
      return null;
    }
  }

  /**
   * Recursively converts external expression data to internal filter tree
   * @param expression - The external expression data
   * @returns Internal filter expression
   */
  private _convertExpressionToInternal(
    expression: TWorkItemFilterExpressionData
  ): TFilterExpression<TWorkItemFilterProperty> {
    if (!expression || isEmpty(expression)) {
      throw new Error("Invalid expression: empty or null data");
    }

    // Check if it's a simple condition (has field property)
    if (this._isWorkItemFilterConditionData(expression)) {
      const conditionResult = this._extractWorkItemFilterConditionData(expression);
      if (!conditionResult) {
        throw new Error("Failed to extract condition data");
      }

      const [property, operator, value] = conditionResult;
      return createConditionNode({
        property,
        operator,
        value,
      });
    }

    // It's a logical group - check which type
    const expressionKeys = Object.keys(expression);

    if (LOGICAL_OPERATOR.AND in expression) {
      const andExpression = expression as { [LOGICAL_OPERATOR.AND]: TWorkItemFilterExpressionData[] };
      const andConditions = andExpression[LOGICAL_OPERATOR.AND];

      if (!Array.isArray(andConditions) || andConditions.length === 0) {
        throw new Error("AND group must contain at least one condition");
      }

      const convertedConditions = andConditions.map((item) => this._convertExpressionToInternal(item));
      return createAndGroupNode(convertedConditions);
    }

    throw new Error(`Invalid expression: unknown structure with keys [${expressionKeys.join(", ")}]`);
  }

  /**
   * Converts internal filter expression to external format
   * @param internalFilter - The internal filter expression
   * @returns External filter expression
   */
  toExternal(internalFilter: TFilterExpression<TWorkItemFilterProperty>): TWorkItemFilterExpression {
    if (!internalFilter) {
      return {};
    }

    try {
      return this._convertExpressionToExternal(internalFilter);
    } catch (error) {
      console.error("Failed to convert internal filter to external:", error);
      return {};
    }
  }

  /**
   * Recursively converts internal expression to external format
   * @param expression - The internal filter expression
   * @returns External expression data
   */
  private _convertExpressionToExternal(
    expression: TFilterExpression<TWorkItemFilterProperty>
  ): TWorkItemFilterExpressionData {
    if (isConditionNode(expression)) {
      return this._createWorkItemFilterConditionData(expression.property, expression.operator, expression.value);
    }

    // It's a group node

    if (isAndGroupNode(expression)) {
      return {
        [LOGICAL_OPERATOR.AND]: expression.children.map((child) => this._convertExpressionToExternal(child)),
      } as TWorkItemFilterExpressionData;
    }

    throw new Error(`Unknown group node type for expression`);
  }

  /**
   * Type guard to check if data is of type TWorkItemFilterConditionData
   * @param data - The data to check
   * @returns True if data is TWorkItemFilterConditionData, false otherwise
   */
  private _isWorkItemFilterConditionData = (data: unknown): data is TWorkItemFilterConditionData => {
    if (!data || typeof data !== "object" || isEmpty(data)) return false;

    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    // Check if any key contains logical operators (would indicate it's a group)
    const hasLogicalOperators = keys.some((key) => key === LOGICAL_OPERATOR.AND);
    if (hasLogicalOperators) return false;

    // All keys must match the work item filter condition key pattern
    return keys.every((key) => this._isValidWorkItemFilterConditionKey(key));
  };

  /**
   * Validates if a key is a valid work item filter condition key
   * @param key - The key to validate
   * @returns True if the key is valid
   */
  private _isValidWorkItemFilterConditionKey = (key: string): key is TWorkItemFilterConditionKey => {
    if (typeof key !== "string" || key.length === 0) return false;

    // Find the last occurrence of '__' to separate property from operator
    const lastDoubleUnderscoreIndex = key.lastIndexOf("__");
    if (
      lastDoubleUnderscoreIndex === -1 ||
      lastDoubleUnderscoreIndex === 0 ||
      lastDoubleUnderscoreIndex === key.length - 2
    ) {
      return false;
    }

    const property = key.substring(0, lastDoubleUnderscoreIndex);
    const operator = key.substring(lastDoubleUnderscoreIndex + 2);

    // Validate property is in allowed list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!WORK_ITEM_FILTER_PROPERTY_KEYS.includes(property as any) && !property.startsWith("customproperty_")) {
      return false;
    }

    // Validate operator is not empty
    return operator.length > 0;
  };

  /**
   * Extracts property, operator and value from work item filter condition data
   * @param data - The condition data
   * @returns Tuple of property, operator and value, or null if invalid
   */
  private _extractWorkItemFilterConditionData = (
    data: TWorkItemFilterConditionData
  ): [TWorkItemFilterProperty, TSupportedOperators, SingleOrArray<TFilterValue>] | null => {
    const keys = Object.keys(data);
    if (keys.length !== 1) {
      console.error("Work item filter condition data must have exactly one key");
      return null;
    }

    const key = keys[0];
    if (!this._isValidWorkItemFilterConditionKey(key)) {
      console.error(`Invalid work item filter condition key: ${key}`);
      return null;
    }

    // Find the last occurrence of '__' to separate property from operator
    const lastDoubleUnderscoreIndex = key.lastIndexOf("__");
    const property = key.substring(0, lastDoubleUnderscoreIndex);
    const operator = key.substring(lastDoubleUnderscoreIndex + 2) as TSupportedOperators;

    const rawValue = data[key];

    // Parse comma-separated values
    const parsedValue = MULTI_VALUE_OPERATORS.includes(operator) ? this._parseFilterValue(rawValue) : rawValue;

    return [property as TWorkItemFilterProperty, operator, parsedValue];
  };

  /**
   * Parses filter value from string format
   * @param value - The string value to parse
   * @returns Parsed value as string or array of strings
   */
  private _parseFilterValue = (value: TFilterValue): SingleOrArray<TFilterValue> => {
    if (!value) return value;

    if (typeof value !== "string") return value;

    // Handle empty string
    if (value === "") return value;

    // Split by comma if contains comma, otherwise return as single value
    if (value.includes(",")) {
      // Split and trim each value, filter out empty strings
      const splitValues = value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      // Return single value if only one non-empty value after split
      return splitValues.length === 1 ? splitValues[0] : splitValues;
    }

    return value;
  };

  /**
   * Creates TWorkItemFilterConditionData from property, operator and value
   * @param property - The filter property key
   * @param operator - The filter operator
   * @param value - The filter value
   * @returns The condition data object
   */
  private _createWorkItemFilterConditionData = (
    property: TWorkItemFilterProperty,
    operator: TSupportedOperators,
    value: SingleOrArray<TFilterValue>
  ): TWorkItemFilterConditionData => {
    const conditionKey = `${property}__${operator}`;

    // Convert value to string format
    const stringValue = Array.isArray(value) ? value.join(",") : value;

    return {
      [conditionKey]: stringValue,
    } as TWorkItemFilterConditionData;
  };
}

export const workItemFiltersAdapter = new WorkItemFiltersAdapter();
