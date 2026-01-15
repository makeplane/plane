import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { IFilterInstance } from "@plane/shared-state";
import type {
  SingleOrArray,
  TExternalFilter,
  TFilterProperty,
  TFilterValue,
  TFilterConditionNodeForDisplay,
  TAllAvailableOperatorsForDisplay,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn, getOperatorForPayload } from "@plane/utils";
// local imports
import { FilterValueInput } from "../filter-value-input/root";
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../shared";
import { FilterItemCloseButton } from "./close-button";
import { FilterItemContainer } from "./container";
import { InvalidFilterItem } from "./invalid";
import { FilterItemLoader } from "./loader";
import { FilterItemProperty } from "./property";

export interface IFilterItemProps<P extends TFilterProperty, E extends TExternalFilter> {
  condition: TFilterConditionNodeForDisplay<P, TFilterValue>;
  filter: IFilterInstance<P, E>;
  isDisabled?: boolean;
  showTransition?: boolean;
}

export const FilterItem = observer(function FilterItem<P extends TFilterProperty, E extends TExternalFilter>(
  props: IFilterItemProps<P, E>
) {
  const { condition, filter, isDisabled = false, showTransition = true } = props;
  // derived values
  const filterConfig = condition?.property ? filter.configManager.getConfigByProperty(condition.property) : undefined;
  const operatorOptions = filterConfig
    ?.getAllDisplayOperatorOptionsByValue(condition.value as TFilterValue)
    .map((option) => ({
      value: option.value,
      content: option.label,
      query: option.label.toLowerCase(),
    }));
  const selectedOperatorFieldConfig = filterConfig?.getOperatorConfig(condition.operator);
  const selectedOperatorOption = filterConfig?.getDisplayOperatorByValue(
    condition.operator,
    condition.value as TFilterValue
  );
  // Disable operator selection when filter is disabled or only one operator option is available and selected
  const isOperatorSelectionDisabled =
    isDisabled ||
    (condition.operator && operatorOptions?.length === 1 && operatorOptions[0]?.value === condition.operator);

  const handleOperatorChange = (operator: TAllAvailableOperatorsForDisplay) => {
    if (operator) {
      const { operator: positiveOperator, isNegation } = getOperatorForPayload(operator);
      filter.updateConditionOperator(condition.id, positiveOperator, isNegation);
    }
  };

  const handleValueChange = (values: SingleOrArray<TFilterValue>) => {
    filter.updateConditionValue(condition.id, values);
  };

  if (!filter.configManager.areConfigsReady) {
    return <FilterItemLoader />;
  }

  if (!filterConfig) {
    return (
      <InvalidFilterItem
        condition={condition}
        filter={filter}
        isDisabled={isDisabled}
        showTransition={showTransition}
      />
    );
  }

  return (
    <FilterItemContainer conditionValue={condition.value} showTransition={showTransition}>
      {/* Property section */}
      <FilterItemProperty
        conditionId={condition.id}
        filter={filter}
        icon={filterConfig.icon}
        isDisabled={isDisabled}
        label={filterConfig.label}
        tooltipContent={filterConfig.tooltipContent}
      />

      {/* Operator section */}
      <CustomSearchSelect
        value={condition.operator}
        onChange={handleOperatorChange}
        options={operatorOptions}
        className={COMMON_FILTER_ITEM_BORDER_CLASSNAME}
        customButtonClassName={cn(
          "h-full px-2 text-13 font-regular",
          isOperatorSelectionDisabled && "hover:bg-layer-2-hover"
        )}
        optionsClassName="w-48"
        maxHeight="2xl"
        disabled={isOperatorSelectionDisabled}
        customButton={
          <div className="flex items-center h-full" aria-disabled={isOperatorSelectionDisabled}>
            {filterConfig.getLabelForOperator(selectedOperatorOption)}
          </div>
        }
      />

      {/* Value section */}
      {selectedOperatorFieldConfig && (
        <FilterValueInput
          filterFieldConfig={selectedOperatorFieldConfig}
          condition={condition}
          onChange={handleValueChange}
          isDisabled={isDisabled}
        />
      )}

      {/* Remove button */}
      {!isDisabled && <FilterItemCloseButton conditionId={condition.id} filter={filter} />}
    </FilterItemContainer>
  );
});
