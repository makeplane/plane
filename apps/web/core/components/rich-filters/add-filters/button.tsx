/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import { Button } from "@makeplane/propel/elements/button";
import type { ButtonSize, ButtonVariant } from "@makeplane/propel/elements/button";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty, TSupportedOperators } from "@plane/types";
import { LOGICAL_OPERATOR } from "@plane/types";
// local imports
import { AddFilterDropdown } from "./dropdown";

type TLegacyButtonSize = "sm" | "base" | "lg" | "xl";
type TLegacyButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "link" | "error-fill" | "error-outline";

const ADD_FILTER_BUTTON_SIZE: Record<TLegacyButtonSize, ButtonSize> = {
  sm: "xs",
  base: "sm",
  lg: "md",
  xl: "lg",
};

const ADD_FILTER_BUTTON_VARIANT: Record<TLegacyButtonVariant, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  tertiary: "tertiary",
  ghost: "ghost",
  link: "ghost",
  "error-fill": "danger",
  "error-outline": "danger-outline",
};

export type TAddFilterButtonProps<P extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: {
    label: string | null;
    variant?: TLegacyButtonVariant;
    size?: TLegacyButtonSize;
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
    size = "base",
    label,
    iconConfig = { shouldShowIcon: true },
    isDisabled = false,
  } = buttonConfig || {};
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
        className: "border-none bg-transparent p-0 hover:bg-transparent",
      }}
      handleFilterSelect={handleFilterSelect}
      customButton={
        <Button
          variant={ADD_FILTER_BUTTON_VARIANT[variant]}
          size={ADD_FILTER_BUTTON_SIZE[size]}
          stretch="auto"
          render={<div />}
        >
          {iconConfig.shouldShowIcon && <FilterIcon className="size-4 text-secondary" />}
          {label}
        </Button>
      }
    />
  );
});
