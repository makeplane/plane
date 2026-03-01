/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import type {
  SingleOrArray,
  TBooleanFilterFieldConfig,
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TFilterConditionNode,
  TFilterConditionNodeForDisplay,
  TFilterProperty,
  TFilterValue,
  TMultiSelectFilterFieldConfig,
  TNumberFilterFieldConfig,
  TNumberRangeFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TTextFilterFieldConfig,
} from "@plane/types";
import { FILTER_FIELD_TYPE } from "@plane/types";
// local imports
import { BooleanFilterValueInput } from "./boolean/root";
import { DateRangeFilterValueInput } from "./date/range";
import { MultiSelectFilterValueInput } from "./select/multi";
import { NumberFilterValueInput } from "./number/single";
import { NumberRangeFilterValueInput } from "./number/range";
import { SingleDateFilterValueInput } from "./date/single";
import { SingleSelectFilterValueInput } from "./select/single";
import { TextFilterValueInput } from "./text/root";
import type { TFilterValueInputProps } from "../shared";

export const FilterValueInput = observer(function FilterValueInput<P extends TFilterProperty, V extends TFilterValue>(
  props: TFilterValueInputProps<P, V>
) {
  const { condition, filterFieldConfig, isDisabled = false, onChange } = props;

  // Single select input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.SINGLE_SELECT) {
    return (
      <SingleSelectFilterValueInput<P>
        config={filterFieldConfig as TSingleSelectFilterFieldConfig<string>}
        condition={condition as TFilterConditionNodeForDisplay<P, string>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // Multi select input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.MULTI_SELECT) {
    return (
      <MultiSelectFilterValueInput<P>
        config={filterFieldConfig as TMultiSelectFilterFieldConfig<string>}
        condition={condition as TFilterConditionNode<P, string>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // Date filter input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.DATE) {
    return (
      <SingleDateFilterValueInput<P>
        config={filterFieldConfig as TDateFilterFieldConfig<string>}
        condition={condition as TFilterConditionNodeForDisplay<P, string>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // Date range filter input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.DATE_RANGE) {
    return (
      <DateRangeFilterValueInput<P>
        config={filterFieldConfig as TDateRangeFilterFieldConfig<string>}
        condition={condition as TFilterConditionNodeForDisplay<P, string>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // Boolean filter input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.BOOLEAN) {
    return (
      <BooleanFilterValueInput<P>
        config={filterFieldConfig as TBooleanFilterFieldConfig}
        condition={condition as TFilterConditionNodeForDisplay<P, boolean>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // Text filter input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.TEXT) {
    return (
      <TextFilterValueInput<P>
        config={filterFieldConfig as TTextFilterFieldConfig<string>}
        condition={condition as TFilterConditionNodeForDisplay<P, string>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // Number filter input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.NUMBER) {
    return (
      <NumberFilterValueInput<P>
        config={filterFieldConfig as TNumberFilterFieldConfig<number>}
        condition={condition as TFilterConditionNodeForDisplay<P, number>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // Number range filter input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.NUMBER_RANGE) {
    return (
      <NumberRangeFilterValueInput<P>
        config={filterFieldConfig as TNumberRangeFilterFieldConfig<number>}
        condition={condition as TFilterConditionNodeForDisplay<P, number>}
        isDisabled={isDisabled}
        onChange={(value) => onChange(value as SingleOrArray<V>)}
      />
    );
  }

  // With value filter input
  if (filterFieldConfig?.type === FILTER_FIELD_TYPE.WITH_VALUE) {
    // No input needed for "with value" filters—render nothing.
    return <></>;
  }

  return (
    // Fallback
    <div className="h-full flex items-center px-4 text-11 text-placeholder transition-opacity duration-200 cursor-not-allowed">
      Filter type not supported
    </div>
  );
});
