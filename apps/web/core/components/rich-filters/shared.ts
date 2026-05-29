import type {
  SingleOrArray,
  TFilterConditionNodeForDisplay,
  TFilterProperty,
  TFilterValue,
  TSupportedFilterFieldConfigs,
} from "@plane/types";

export const COMMON_FILTER_ITEM_BORDER_CLASSNAME = "border-r border-subtle-1";

export const EMPTY_FILTER_PLACEHOLDER_TEXT = "--";

export type TFilterValueInputProps<P extends TFilterProperty, V extends TFilterValue> = {
  condition: TFilterConditionNodeForDisplay<P, V>;
  filterFieldConfig: TSupportedFilterFieldConfigs<V>;
  isDisabled?: boolean;
  onChange: (values: SingleOrArray<V>) => void;
};
