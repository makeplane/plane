import { TAllAvailableOperatorsForDisplay, TSupportedOperators } from "@plane/types";
import { isNegativeOperator, toPositiveOperator } from "./extended";

/**
 * Result type for operator conversion
 */
export type TOperatorForPayload = {
  operator: TSupportedOperators;
  isNegation: boolean;
};

/**
 * Converts a display operator to the format needed for supported by filter expression condition.
 * @param displayOperator - The operator from the UI
 * @returns Object with supported operator and negation flag
 */
export const getOperatorForPayload = (displayOperator: TAllAvailableOperatorsForDisplay): TOperatorForPayload => {
  const isNegation = isNegativeOperator(displayOperator);
  const operator = isNegation ? toPositiveOperator(displayOperator) : displayOperator;

  return {
    operator,
    isNegation,
  };
};
