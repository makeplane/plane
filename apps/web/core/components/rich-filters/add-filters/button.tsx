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
import { Button as ButtonElement } from "@makeplane/propel/elements/button";
import { IconButton as IconButtonElement } from "@makeplane/propel/elements/icon-button";
import { useTranslation } from "@plane/i18n";
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
    label,
    iconConfig = { shouldShowIcon: true },
    isDisabled = false,
  } = buttonConfig || {};
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const FilterIcon = iconConfig.iconComponent || FilterOutline;
  const iconSizeClassName = size === "xs" || size === "sm" ? "size-3.5" : "size-4";

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
      handleFilterSelect={handleFilterSelect}
      triggerAriaLabel={label ? undefined : t("common.filters")}
      customButton={
        // The dropdown trigger is the native button, so this borrows the styled element chrome only.
        label ? (
          <ButtonElement variant={variant} size={size} stretch="auto" render={<span />}>
            {iconConfig.shouldShowIcon && <FilterIcon className={cn(iconSizeClassName, "text-secondary")} />}
            {label}
          </ButtonElement>
        ) : (
          <IconButtonElement variant={variant} size={size} render={<span />}>
            {iconConfig.shouldShowIcon && <FilterIcon className={cn(iconSizeClassName, "text-secondary")} />}
          </IconButtonElement>
        )
      }
    />
  );
});
