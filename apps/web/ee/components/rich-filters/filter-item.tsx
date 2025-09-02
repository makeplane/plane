import React, { useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane imports
import {
  SingleOrArray,
  TAllOperators,
  TExternalFilter,
  TFilterConditionNode,
  TFilterProperty,
  TFilterValue,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { getOperatorLabel, getValidOperatorsForType, shouldNotifyChangeForValue } from "@plane/utils";
// plane web imports
import { IFilterInstance } from "@/plane-web/store/rich-filters/filter";
// local imports
import { FilterValueInput } from "./filter-value-input";

interface FilterItemProps<P extends TFilterProperty, E extends TExternalFilter> {
  filter: IFilterInstance<P, E>;
  condition: TFilterConditionNode<P, TFilterValue>;
  showTransition?: boolean;
}

export const FilterItem = observer(
  <P extends TFilterProperty, E extends TExternalFilter>(props: FilterItemProps<P, E>) => {
    const { filter, condition, showTransition = true } = props;
    // refs
    const itemRef = useRef<HTMLDivElement>(null);
    // derived values
    const config = condition?.property ? filter.configManager.getConfigById(condition.property) : undefined;
    const isFilterEnabled = config?.isEnabled;

    // effects
    useEffect(() => {
      if (!showTransition) return;

      const element = itemRef.current;
      if (!element) return;

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
    }, [showTransition]);

    if (!config) return null;

    const operatorOptions = filter
      .getValidOperatorsForCondition(condition.id, getValidOperatorsForType(config.type, config.customOperators))
      .map((operator: TAllOperators) => {
        const label = getOperatorLabel(operator);

        return {
          value: operator,
          content: label,
          query: label.toLowerCase(),
        };
      });

    const handleOperatorChange = (operator: TAllOperators) => {
      if (operator) {
        filter.updateCondition(condition.id, { operator });
      }
    };

    const handleValueChange = (values: SingleOrArray<TFilterValue>) => {
      if (!shouldNotifyChangeForValue(values)) {
        filter.removeCondition(condition.id);
        return;
      }
      filter.updateCondition(condition.id, { value: values });
    };

    const handleRemoveFilter = () => {
      filter.removeCondition(condition.id);
    };

    if (!isFilterEnabled) return null;

    return (
      <div
        ref={itemRef}
        className="flex h-7 items-stretch rounded overflow-hidden border border-custom-border-200 bg-custom-background-100 transition-all duration-200"
      >
        {/* Property section */}
        <div className="flex items-center gap-1 px-2 py-0.5 text-xs border-r border-custom-border-200 text-custom-text-300 min-w-0">
          {config.icon && (
            <div className="transition-transform duration-200 ease-in-out flex-shrink-0">
              <config.icon className="size-3.5" />
            </div>
          )}
          <span className="truncate">{config.label}</span>
        </div>

        {/* Operator section */}
        <CustomSearchSelect
          value={condition.operator}
          onChange={handleOperatorChange}
          options={operatorOptions}
          className="border-r border-custom-border-200"
          customButtonClassName="h-full px-2 text-sm font-normal"
          optionsClassName="w-48"
          customButton={<div className="flex items-center h-full">{getOperatorLabel(condition.operator)}</div>}
        />

        {/* Value section */}
        <FilterValueInput config={config} filter={condition} onChange={handleValueChange} />

        {/* Remove button */}
        <button
          onClick={handleRemoveFilter}
          className="px-1.5 text-custom-text-400 hover:text-custom-text-300 focus:outline-none hover:bg-custom-background-90 border-l border-custom-border-200"
          type="button"
          aria-label="Remove filter"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }
);
