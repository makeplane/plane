import React from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  TFilterConditionNode,
  TFilterValue,
  TFilterProperty,
  SingleOrArray,
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TSupportedFilterFieldConfigs,
  TFilterConditionNodeForDisplay,
} from "@plane/types";
import { FILTER_FIELD_TYPE } from "@plane/types";
// local imports
import { DateRangeFilterValueInput } from "./date/range";
import { SingleDateFilterValueInput } from "./date/single";
import { MultiSelectFilterValueInput } from "./select/multi";
import { SingleSelectFilterValueInput } from "./select/single";

type TFilterValueInputProps<P extends TFilterProperty, V extends TFilterValue> = {
  condition: TFilterConditionNodeForDisplay<P, V>;
  filterFieldConfig: TSupportedFilterFieldConfigs<V>;
  isDisabled?: boolean;
  onChange: (values: SingleOrArray<V>) => void;
};

// TODO: Prevent type assertion
export const FilterValueInput = observer(
  <P extends TFilterProperty, V extends TFilterValue>(props: TFilterValueInputProps<P, V>) => {
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

    // Fallback
    return (
      <div className="h-full flex items-center px-4 text-xs text-custom-text-400 transition-opacity duration-200 cursor-not-allowed">
        Filter type not supported
      </div>
    );
  }
);
