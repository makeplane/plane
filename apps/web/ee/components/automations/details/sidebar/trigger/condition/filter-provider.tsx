import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TAutomationConditionFilterExpression, TAutomationConditionFilterProperty } from "@plane/types";
// plane web imports
import { useAutomationConfig } from "@/plane-web/hooks/automations/use-automation-condition-config";
import { automationConditionFilterAdapter } from "@/plane-web/store/automations/node/condition/adapter";
import { FilterInstance, IFilterInstance } from "@/plane-web/store/rich-filters/filter";

type TAutomationConditionFilterHOCProps = {
  children:
    | React.ReactNode
    | ((props: {
        filter: IFilterInstance<TAutomationConditionFilterProperty, TAutomationConditionFilterExpression>;
      }) => React.ReactNode);
  initialFilterExpression: TAutomationConditionFilterExpression;
  projectId: string;
  updateFilterExpression?: (updatedFilters: TAutomationConditionFilterExpression) => void;
  workspaceSlug: string;
};

export const AutomationConditionFilterHOC = observer((props: TAutomationConditionFilterHOCProps) => {
  const { children, projectId, initialFilterExpression, updateFilterExpression, workspaceSlug } = props;
  // Create new filter instance
  const conditionFilter = useMemo(
    () =>
      new FilterInstance<TAutomationConditionFilterProperty, TAutomationConditionFilterExpression>({
        adapter: automationConditionFilterAdapter,
        initialExpression: initialFilterExpression,
        onExpressionChange: updateFilterExpression,
      }),
    [initialFilterExpression, updateFilterExpression]
  );
  // config
  const { automationConfigs } = useAutomationConfig({
    projectId,
    workspaceSlug,
  });
  conditionFilter.configManager.registerAll(automationConfigs);

  return <>{typeof children === "function" ? children({ filter: conditionFilter }) : children}</>;
});
