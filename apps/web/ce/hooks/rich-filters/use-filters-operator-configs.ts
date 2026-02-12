import { useMemo } from "react";
import type { TSupportedOperators } from "@plane/types";
import { CORE_OPERATORS } from "@plane/types";

export type TFiltersOperatorConfigs = {
  allowedOperators: Set<TSupportedOperators>;
  allowNegative: boolean;
};

export type TUseFiltersOperatorConfigsProps = {
  workspaceSlug: string;
};

export const useFiltersOperatorConfigs = (_props: TUseFiltersOperatorConfigsProps): TFiltersOperatorConfigs =>
  useMemo(
    () => ({
      allowedOperators: new Set(Object.values(CORE_OPERATORS)),
      allowNegative: false,
    }),
    []
  );
