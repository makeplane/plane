import React, { useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
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
import { cn, hasValidValue, getOperatorForPayload } from "@plane/utils";
// local imports
import { FilterValueInput } from "./filter-value-input/root";
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "./shared";

interface FilterItemProps<P extends TFilterProperty, E extends TExternalFilter> {
  condition: TFilterConditionNodeForDisplay<P, TFilterValue>;
  filter: IFilterInstance<P, E>;
  isDisabled?: boolean;
  showTransition?: boolean;
}

export const FilterItem = observer(
  <P extends TFilterProperty, E extends TExternalFilter>(props: FilterItemProps<P, E>) => {
    const { condition, filter, isDisabled = false, showTransition = true } = props;
    // refs
    const itemRef = useRef<HTMLDivElement>(null);
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

    // effects
    useEffect(() => {
      if (!showTransition) return;

      const element = itemRef.current;
      if (!element) return;

      if (hasValidValue(condition.value)) return;

      const applyInitialStyles = () => {
        element.style.opacity = "0";
        element.style.transform = "scale(0.95)";
      };

      const applyFinalStyles = () => {
        // Force a reflow to ensure the initial state is applied
        void element.offsetWidth;
        element.style.opacity = "1";
        element.style.transform = "scale(1)";
      };

      applyInitialStyles();
      applyFinalStyles();

      return () => {
        applyInitialStyles();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOperatorChange = (operator: TAllAvailableOperatorsForDisplay) => {
      if (operator) {
        const { operator: positiveOperator, isNegation } = getOperatorForPayload(operator);
        filter.updateConditionOperator(condition.id, positiveOperator, isNegation);
      }
    };

    const handleValueChange = (values: SingleOrArray<TFilterValue>) => {
      filter.updateConditionValue(condition.id, values);
    };

    const handleRemoveFilter = () => {
      filter.removeCondition(condition.id);
    };

    if (!filterConfig || !filterConfig.isEnabled) return null;
    return (
      <div
        ref={itemRef}
        className="flex h-7 items-stretch rounded overflow-hidden border border-custom-border-200 bg-custom-background-100 transition-all duration-200"
      >
        {/* Property section */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 text-xs text-custom-text-300 min-w-0",
            COMMON_FILTER_ITEM_BORDER_CLASSNAME
          )}
        >
          {filterConfig.icon && (
            <div className="transition-transform duration-200 ease-in-out flex-shrink-0">
              <filterConfig.icon className="size-3.5" />
            </div>
          )}
          <span className="truncate">{filterConfig.label}</span>
        </div>

        {/* Operator section */}
        <CustomSearchSelect
          value={condition.operator}
          onChange={handleOperatorChange}
          options={operatorOptions}
          className={COMMON_FILTER_ITEM_BORDER_CLASSNAME}
          customButtonClassName={cn(
            "h-full px-2 text-sm font-normal",
            isOperatorSelectionDisabled && "hover:bg-custom-background-100"
          )}
          optionsClassName="w-48"
          maxHeight="full"
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
        {!isDisabled && (
          <button
            onClick={handleRemoveFilter}
            className="px-1.5 text-custom-text-400 hover:text-custom-text-300 focus:outline-none hover:bg-custom-background-90"
            type="button"
            aria-label="Remove filter"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    );
  }
);
