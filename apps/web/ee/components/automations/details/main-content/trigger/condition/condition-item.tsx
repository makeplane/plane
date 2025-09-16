import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { IFilterInstance } from "@plane/shared-state";
import type {
  IFilterOption,
  TAutomationConditionFilterExpression,
  TAutomationConditionFilterProperty,
  TExternalFilter,
  TFilterConditionNodeForDisplay,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
// local imports
import { SelectedOptionsDisplay } from "@/components/rich-filters/filter-value-input/select/selected-options-display";
import { loadOptions } from "@/components/rich-filters/filter-value-input/select/shared";

interface FilterItemProps<K extends TFilterProperty, E extends TExternalFilter> {
  filter: IFilterInstance<K, E>;
  condition: TFilterConditionNodeForDisplay<K, TFilterValue>;
}

export const AutomationDetailsMainContentTriggerConditionItem: React.FC<
  FilterItemProps<TAutomationConditionFilterProperty, TAutomationConditionFilterExpression>
> = observer((props) => {
  const { filter, condition } = props;
  // states
  const [options, setOptions] = useState<IFilterOption<TFilterValue>[]>([]);
  // derived values
  const config = condition?.property ? filter.configManager.getConfigByProperty(condition.property) : undefined;
  const selectedOperatorFieldConfig = config?.getOperatorConfig(condition.operator);
  const selectedOperatorOption = config?.getDisplayOperatorByValue(condition.operator, condition.value as TFilterValue);
  const isFilterEnabled = config?.isEnabled;

  useEffect(() => {
    if (!selectedOperatorFieldConfig) return;
    loadOptions({ config: selectedOperatorFieldConfig, setOptions });
  }, [selectedOperatorFieldConfig]);

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
        {config.getLabelForOperator(selectedOperatorOption)}
      </span>
      {/* TODO: Handle date values */}
      <SelectedOptionsDisplay selectedValue={condition.value} options={options} displayCount={3} />
    </div>
  );
});
