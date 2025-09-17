import { CORE_OPERATORS, TSupportedOperators } from "@plane/types";

export type TFiltersOperatorConfigs = {
  allowedOperators: Set<TSupportedOperators>;
  allowNegative: boolean;
};

export const useFiltersOperatorConfigs = (): TFiltersOperatorConfigs => ({
  allowedOperators: new Set(Object.values(CORE_OPERATORS)),
  allowNegative: false,
});
