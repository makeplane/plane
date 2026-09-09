/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { FilterOutline } from "@makeplane/propel/icons";
// plane imports
import type { ButtonSize, ButtonVariant } from "@makeplane/propel/components/button";
import { Button } from "@makeplane/propel/elements/button";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty, TSupportedOperators } from "@plane/types";
import { LOGICAL_OPERATOR } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { AddFilterDropdown } from "./dropdown";

export type TAddFilterButtonProps<P extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: {
    label: string | null;
    variant?: ButtonVariant;
    size?: ButtonSize;
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

export const AddFilterButton = observer(function AddFilterButton<P extends TFilterProperty, E extends TExternalFilter>(
  props: TAddFilterButtonProps<P, E>
) {
  const { filter, buttonConfig, onFilterSelect } = props;
  const {
    variant = "secondary",
    size = "sm",
    className,
    label,
    iconConfig = { shouldShowIcon: true },
    isDisabled = false,
  } = buttonConfig || {};
  // derived values
  const FilterIcon = iconConfig.iconComponent || FilterOutline;

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
        className: undefined,
      }}
      handleFilterSelect={handleFilterSelect}
      customButton={
        <Button
          variant={variant}
          size={size}
          stretch="auto"
          render={<div className={cn("flex items-center gap-1 py-[5px]", className)} />}
        >
          {iconConfig.shouldShowIcon && <FilterIcon className="size-4 text-secondary" />}
          {label}
        </Button>
      }
    />
  );
});
