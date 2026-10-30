/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
import { Select } from "@plane/blocks/select";
import { getOperatorForPayload } from "@plane/utils";
// local imports
import { FilterValueInput } from "../filter-value-input/root";
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
  const operatorOptions =
    filterConfig?.getAllDisplayOperatorOptionsByValue(condition.value as TFilterValue)?.map((option) => ({
      value: option.value,
      label: option.label,
    })) ?? [];
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
    <FilterItemContainer conditionValue={condition.value} showTransition={showTransition} label={filterConfig.label}>
      {/* Property section */}
      <FilterItemProperty
        conditionId={condition.id}
        filter={filter}
        icon={filterConfig.icon}
        isDisabled={isDisabled}
        label={filterConfig.label}
        tooltipContent={typeof filterConfig.tooltipContent === "string" ? filterConfig.tooltipContent : undefined}
      />

      {/* Operator section */}
      <Select<(typeof operatorOptions)[number]>
        getValues={() => operatorOptions}
        value={operatorOptions.find((option) => option.value === condition.operator) ?? null}
        onChange={(operator) => handleOperatorChange(operator as TAllAvailableOperatorsForDisplay)}
        disabled={isOperatorSelectionDisabled}
        getOptionValue={(option) => option.value}
        getOptionLabel={(option) => option.label}
        pinSelected={false}
        placeholder={filterConfig.label}
      >
        {/* A pill segment of the condition, chevron-less like the segments either side of it. */}
        <Select.Trigger variant="pill-lg" appendIcon={null} className="max-w-none text-body-xs-regular">
          {filterConfig.getLabelForOperator(selectedOperatorOption)}
        </Select.Trigger>
      </Select>

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
