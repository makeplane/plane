import React from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import { IFilterInstance } from "@plane/shared-state";
import { LOGICAL_OPERATOR, TExternalFilter, TFilterProperty } from "@plane/types";
import { CustomSearchSelect, getButtonStyling, TButtonVariant } from "@plane/ui";
import { cn, getOperatorForPayload } from "@plane/utils";

export type TAddFilterButtonProps<P extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: {
    label?: string;
    variant?: TButtonVariant;
    className?: string;
    defaultOpen?: boolean;
    iconConfig?: {
      shouldShowIcon: boolean;
      iconComponent?: React.ReactNode;
    };
    isDisabled?: boolean;
  };
  filter: IFilterInstance<P, E>;
  onFilterSelect?: (id: string) => void;
};

export const AddFilterButton = observer(
  <P extends TFilterProperty, E extends TExternalFilter>(props: TAddFilterButtonProps<P, E>) => {
    const { filter, buttonConfig, onFilterSelect } = props;
    const {
      label = "Filters",
      variant = "link-neutral",
      className,
      defaultOpen = false,
      iconConfig = { shouldShowIcon: true },
      isDisabled = false,
    } = buttonConfig || {};

    // Transform available filter configs to CustomSearchSelect options format
    const filterOptions = filter.configManager.allAvailableConfigs.map((config) => ({
      value: config.id,
      content: (
        <div className="flex items-center gap-2 text-custom-text-200 transition-all duration-200 ease-in-out">
          {config.icon && (
            <config.icon className="size-4 text-custom-text-300 transition-transform duration-200 ease-in-out" />
          )}
          <span>{config.label}</span>
        </div>
      ),
      query: config.label.toLowerCase(),
    }));

    // If all filters are applied, show disabled options
    const allFiltersApplied = filterOptions.length === 0;
    const displayOptions = allFiltersApplied
      ? [
          {
            value: "all_filters_applied",
            content: <div className="text-custom-text-400 italic">All filters applied</div>,
            query: "all filters applied",
            disabled: true,
          },
        ]
      : filterOptions;

    const handleFilterSelect = (property: P) => {
      const config = filter.configManager.getConfigByProperty(property);
      if (config && config.firstOperator) {
        const { operator, isNegation } = getOperatorForPayload(config.firstOperator);
        filter.addCondition(
          LOGICAL_OPERATOR.AND,
          {
            property: config.id,
            operator,
            value: undefined,
          },
          isNegation
        );
        onFilterSelect?.(property);
      }
    };

    if (isDisabled) return null;
    return (
      <div className="relative transition-all duration-200 ease-in-out">
        <CustomSearchSelect
          defaultOpen={defaultOpen}
          value={""}
          onChange={handleFilterSelect}
          options={displayOptions}
          optionsClassName="w-56"
          maxHeight="full"
          placement="bottom-start"
          disabled={isDisabled}
          customButtonClassName={cn(getButtonStyling(variant, "sm"), className)}
          customButton={
            <div className="flex items-center gap-1">
              {iconConfig.shouldShowIcon &&
                (iconConfig.iconComponent || <ListFilter className="size-4 text-custom-text-200" />)}
              {label}
            </div>
          }
        />
      </div>
    );
  }
);
