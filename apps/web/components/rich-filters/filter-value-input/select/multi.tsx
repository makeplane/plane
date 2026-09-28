/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
import { useTranslation } from "@plane/i18n";
import { Select } from "@plane/blocks/select";
import { cn, toFilterArray, getFilterValueLength } from "@plane/utils";
// local imports
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../../shared";
import { SelectedOptionsDisplay } from "./selected-options-display";
import { loadOptions } from "./shared";

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
  // plane hooks
  const { t } = useTranslation();
  // states
  const [options, setOptions] = useState<IFilterOption<string>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // derived values
  const selectedValues = useMemo(() => toFilterArray(condition.value).map(String), [condition.value]);

  useEffect(() => {
    loadOptions({ config, setOptions, setLoading });
  }, [config]);

  const handleSelectChange = (values: string[]) => {
    onChange(values);
  };

  return (
    <div className={cn("flex min-w-0", !isDisabled && COMMON_FILTER_ITEM_BORDER_CLASSNAME)}>
      <Select<IFilterOption<string>>
        multiple
        getValues={() => options}
        valueIds={selectedValues}
        // Ruling 46: a value whose option has not loaded yet survives `onChange` as a stand-in.
        getOptionPlaceholder={(id) => ({ id, label: id, value: id })}
        onChange={handleSelectChange}
        getOptionValue={(option) => option.value}
        getOptionLabel={(option) => option.label}
        getOptionIcon={(option) =>
          option.icon ? <span className={cn("shrink-0", option.iconClassName)}>{option.icon}</span> : undefined
        }
        getOptionDescription={(option) => option.description}
        getOptionDisabled={(option) => !!option.disabled}
        disabled={isDisabled}
        emptyMessage={loading ? t("common.loading") : undefined}
        defaultOpen={getFilterValueLength(condition.value) === 0}
      >
        {/* A flat segment of the filter chip, like the operator segment beside it. */}
        <Select.Trigger variant="select-ghost-md" appendIcon={null} className="h-full min-h-0 rounded-none">
          <SelectedOptionsDisplay<string> selectedValue={condition.value} options={options} />
        </Select.Trigger>
      </Select>
    </div>
  );
});
