import React from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty, TSupportedOperators } from "@plane/types";
import { LOGICAL_OPERATOR } from "@plane/types";
import type { TButtonVariant } from "@plane/ui";
import { cn, getButtonStyling } from "@plane/ui";
// local imports
import { AddFilterDropdown } from "./dropdown";

export type TAddFilterButtonProps<P extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: {
    label: string | null;
    variant?: TButtonVariant;
    className?: string;
    defaultOpen?: boolean;
    iconConfig?: {
      shouldShowIcon: boolean;
      iconComponent?: React.ElementType;
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
      variant = "link-neutral",
      className,
      label,
      iconConfig = { shouldShowIcon: true },
      isDisabled = false,
    } = buttonConfig || {};
    // derived values
    const FilterIcon = iconConfig.iconComponent || ListFilter;

    const handleFilterSelect = (property: P, operator: TSupportedOperators, isNegation: boolean) => {
      filter.addCondition(
        LOGICAL_OPERATOR.AND,
        {
          property,
          operator,
          value: undefined,
        },
        isNegation
      );
      onFilterSelect?.(property);
    };

    if (isDisabled) return null;
    return (
      <AddFilterDropdown
        {...props}
        buttonConfig={{
          ...buttonConfig,
          className: cn(getButtonStyling(variant, "sm"), "py-[5px]", className),
        }}
        handleFilterSelect={handleFilterSelect}
        customButton={
          <div className="flex items-center gap-1">
            {iconConfig.shouldShowIcon && <FilterIcon className="size-4 text-custom-text-200" />}
            {label}
          </div>
        }
      />
    );
  }
);
