import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TAutomationConditionFilterExpression, TAutomationConditionFilterKeys } from "@plane/types";
// plane web imports
import { useAutomationConfig } from "@/plane-web/hooks/automations/use-automation-condition-config";
import { automationConditionFilterAdapter } from "@/plane-web/store/automations/node/condition/adapter";
import { FilterInstance, IFilterInstance } from "@/plane-web/store/rich-filters/filter";

type TBaseAutomationConditionFilterProps = {
  projectId: string;
  workspaceSlug: string;
  updateFilterExpression?: (updatedFilters: TAutomationConditionFilterExpression) => void;
};

type TAutomationConditionFilterHOCProps = TBaseAutomationConditionFilterProps & {
  initialFilterExpression: TAutomationConditionFilterExpression | undefined;
  children:
    | React.ReactNode
    | ((props: {
        filter: IFilterInstance<TAutomationConditionFilterKeys, TAutomationConditionFilterExpression> | undefined;
      }) => React.ReactNode);
};

export const AutomationConditionFilterHOC = observer((props: TAutomationConditionFilterHOCProps) => {
  const { children, initialFilterExpression } = props;

  // Only initialize filter instance when initialFilterExpression are defined
  if (!initialFilterExpression)
    return <>{typeof children === "function" ? children({ filter: undefined }) : children}</>;

  return (
    <AutomationConditionFilterRoot {...props} initialFilterExpression={initialFilterExpression}>
      {children}
    </AutomationConditionFilterRoot>
  );
});

type TAutomationConditionFilterProps = TBaseAutomationConditionFilterProps & {
  initialFilterExpression: TAutomationConditionFilterExpression;
  children:
    | React.ReactNode
    | ((props: {
        filter: IFilterInstance<TAutomationConditionFilterKeys, TAutomationConditionFilterExpression>;
      }) => React.ReactNode);
};

const AutomationConditionFilterRoot = observer((props: TAutomationConditionFilterProps) => {
  const { children, projectId, initialFilterExpression, updateFilterExpression, workspaceSlug } = props;
  // Create new filter instance
  const conditionFilter = useMemo(
    () =>
      new FilterInstance<TAutomationConditionFilterKeys, TAutomationConditionFilterExpression>({
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
