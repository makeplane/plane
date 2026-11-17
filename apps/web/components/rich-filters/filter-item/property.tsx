/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentPropsWithoutRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { Pill } from "@makeplane/propel/components/pill";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty, TSupportedOperators } from "@plane/types";
// local imports
import { AddFilterDropdown } from "../add-filters/dropdown";

interface IFilterItemPropertyProps<P extends TFilterProperty, E extends TExternalFilter> {
  conditionId: string;
  icon: React.FC<React.SVGAttributes<SVGElement>> | undefined;
  isDisabled?: boolean;
  filter: IFilterInstance<P, E>;
  label: string;
  tooltipContent?: string;
}

export const FilterItemProperty = observer(function FilterItemProperty<
  P extends TFilterProperty,
  E extends TExternalFilter,
>(props: IFilterItemPropertyProps<P, E>) {
  const { conditionId, filter, isDisabled } = props;

  if (isDisabled) {
    return <PropertyButton {...props} />;
  }

  const handleFilterSelect = (property: P, operator: TSupportedOperators, isNegation: boolean) => {
    filter.updateConditionProperty(conditionId, property, operator, isNegation);
  };

  return (
    <AddFilterDropdown
      filter={filter}
      handleFilterSelect={handleFilterSelect}
      // the property segment is the trigger itself, so the pill group sees it as a direct child
      triggerRender={<PropertyButton {...props} />}
    />
  );
});

type TPropertyButtonProps<P extends TFilterProperty, E extends TExternalFilter> = IFilterItemPropertyProps<P, E> &
  ComponentPropsWithoutRef<"button">;

function PropertyButton<P extends TFilterProperty, E extends TExternalFilter>(props: TPropertyButtonProps<P, E>) {
  // Whatever is not named here comes from the combobox trigger cloning this element, so it is
  // forwarded to the pill.
  const {
    conditionId: _conditionId,
    filter: _filter,
    icon: PropertyIcon,
    isDisabled,
    label,
    tooltipContent,
    ...triggerProps
  } = props;

  return (
    <Tooltip label={tooltipContent ?? ""} layout="stacked" side="bottom" align="start" disabled={!tooltipContent}>
      <Pill
        // a disabled pill stays a button so the group's seams still line up with the next segment
        disabled={isDisabled}
        startIcon={PropertyIcon ? <Icon icon={PropertyIcon} tint="tertiary" /> : undefined}
        label={label}
        {...triggerProps}
      />
    </Tooltip>
  );
}
