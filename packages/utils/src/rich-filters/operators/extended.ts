// plane imports
import { TSupportedOperators, TAllAvailableOperatorsForDisplay } from "@plane/types";

// -------- OPERATOR HELPER UTILITIES --------

/**
 * Type guard to check if an operator is positive (not prefixed with -)
 */
export const isPositiveOperator = (operator: TAllAvailableOperatorsForDisplay): operator is TSupportedOperators =>
  !operator.startsWith("-");

/**
 * Type guard to check if an operator is negative (prefixed with -)
 */
export const isNegativeOperator = (operator: TAllAvailableOperatorsForDisplay): operator is `-${TSupportedOperators}` =>
  operator.startsWith("-");

/**
 * Converts a positive operator to its negative counterpart
 */
export const toNegativeOperator = <T extends TSupportedOperators>(operator: T): `-${T}` => `-${operator}` as `-${T}`;

/**
 * Converts a negative operator to its positive counterpart
 */
export const toPositiveOperator = <T extends `-${TSupportedOperators}`>(
  operator: T
): T extends `-${infer U extends TSupportedOperators}` ? U : never =>
  operator.slice(1) as T extends `-${infer U extends TSupportedOperators}` ? U : never;
