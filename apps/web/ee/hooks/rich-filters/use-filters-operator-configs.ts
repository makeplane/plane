// plane imports
import { EXTENDED_OPERATORS } from "@plane/types";
// ce imports
import {
  TFiltersOperatorConfigs,
  TUseFiltersOperatorConfigsProps,
  useFiltersOperatorConfigs as useCoreFiltersOperatorConfigs,
} from "@/ce/hooks/rich-filters/use-filters-operator-configs";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store/use-flag";

export const useFiltersOperatorConfigs = (props: TUseFiltersOperatorConfigsProps): TFiltersOperatorConfigs => {
  const { workspaceSlug } = props;
  // derived values
  const isRichFiltersEnabled = useFlag(workspaceSlug, "RICH_FILTERS");
  const coreOperatorConfig = useCoreFiltersOperatorConfigs(props);

  if (!isRichFiltersEnabled) {
    return coreOperatorConfig;
  }

  return {
    allowedOperators: new Set([...coreOperatorConfig.allowedOperators, ...Object.values(EXTENDED_OPERATORS)]),
    allowNegative: true,
  };
};
