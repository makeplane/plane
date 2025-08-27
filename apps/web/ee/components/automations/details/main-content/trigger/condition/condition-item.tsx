import { observer } from "mobx-react";
// plane imports
import type {
  TAutomationConditionFilterExpression,
  TAutomationConditionFilterProperty,
  TExternalFilter,
  TFilterConditionNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
import { getOperatorLabel } from "@plane/utils";
// plane web imports
import type { IFilterInstance } from "@/plane-web/store/rich-filters/filter";
// local imports
import { AutomationDetailsMainContentTriggerConditionItemValue } from "./condition-item-value";

interface FilterItemProps<K extends TFilterProperty, E extends TExternalFilter> {
  filter: IFilterInstance<K, E>;
  condition: TFilterConditionNode<K, TFilterValue>;
}

export const AutomationDetailsMainContentTriggerConditionItem: React.FC<
  FilterItemProps<TAutomationConditionFilterProperty, TAutomationConditionFilterExpression>
> = observer((props) => {
  const { filter, condition } = props;
  // derived values
  const config = condition?.property ? filter.configManager.getConfigById(condition.property) : undefined;
  const isFilterEnabled = config?.isEnabled;

  if (!isFilterEnabled) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs text-custom-text-300">
      {config.icon && (
        <span className="shrink-0 transition-transform duration-200 ease-in-out">
          <config.icon className="size-3.5" />
        </span>
      )}
      <span className="shrink-0 truncate font-medium">{config.label}</span>
      <span className="shrink-0 font-mono p-0.5 bg-custom-background-80 uppercase rounded-sm font-medium">
        {getOperatorLabel(condition.operator)}
      </span>
      <AutomationDetailsMainContentTriggerConditionItemValue config={config} filter={condition} />
    </div>
  );
});
