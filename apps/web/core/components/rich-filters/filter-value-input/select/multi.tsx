import React, { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  SingleOrArray,
  IFilterOption,
  TFilterProperty,
  TMultiSelectFilterFieldConfig,
  TFilterConditionNodeForDisplay,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { toFilterArray, getFilterValueLength } from "@plane/utils";
// local imports
import { SelectedOptionsDisplay } from "./selected-options-display";
import { getCommonCustomSearchSelectProps, getFormattedOptions, loadOptions } from "./shared";

type TMultiSelectFilterValueInputProps<P extends TFilterProperty> = {
  config: TMultiSelectFilterFieldConfig<string>;
  condition: TFilterConditionNodeForDisplay<P, string>;
  isDisabled?: boolean;
  onChange: (values: SingleOrArray<string>) => void;
};

export const MultiSelectFilterValueInput = observer(function MultiSelectFilterValueInput<P extends TFilterProperty>(
  props: TMultiSelectFilterValueInputProps<P>
) {
  const { config, condition, isDisabled, onChange } = props;
  // states
  const [options, setOptions] = useState<IFilterOption<string>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // derived values
  const formattedOptions = useMemo(() => getFormattedOptions<string>(options), [options]);

  useEffect(() => {
    loadOptions({ config, setOptions, setLoading });
  }, [config]);

  const handleSelectChange = (values: string[]) => {
    onChange(values);
  };

  return (
    <CustomSearchSelect
      {...getCommonCustomSearchSelectProps(isDisabled)}
      value={toFilterArray(condition.value)}
      onChange={handleSelectChange}
      options={formattedOptions}
      multiple
      disabled={loading || isDisabled}
      customButton={<SelectedOptionsDisplay<string> selectedValue={condition.value} options={options} />}
      defaultOpen={getFilterValueLength(condition.value) === 0}
    />
  );
});
