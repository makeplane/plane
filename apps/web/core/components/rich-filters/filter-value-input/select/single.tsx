/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  IFilterOption,
  TFilterProperty,
  TSingleSelectFilterFieldConfig,
  TFilterConditionNodeForDisplay,
} from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { Select } from "@plane/blocks/select";
import { cn, toFilterArray } from "@plane/utils";
// local imports
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../../shared";
import { SelectedOptionsDisplay } from "./selected-options-display";
import { loadOptions } from "./shared";

type TSingleSelectFilterValueInputProps<P extends TFilterProperty> = {
  config: TSingleSelectFilterFieldConfig<string>;
  condition: TFilterConditionNodeForDisplay<P, string>;
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
};

export const SingleSelectFilterValueInput = observer(function SingleSelectFilterValueInput<P extends TFilterProperty>(
  props: TSingleSelectFilterValueInputProps<P>
) {
  const { config, condition, onChange, isDisabled } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [options, setOptions] = useState<IFilterOption<string>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // derived values
  // Ruling 46: a value whose option has not loaded yet still resolves to a stand-in keyed by it.
  const selectedOption = useMemo<IFilterOption<string> | null>(() => {
    const [currentValue] = toFilterArray(condition.value).map(String);
    if (!currentValue) return null;
    return (
      options.find((option) => option.value === currentValue) ?? {
        id: currentValue,
        label: currentValue,
        value: currentValue,
      }
    );
  }, [condition.value, options]);

  useEffect(() => {
    loadOptions({ config, setOptions, setLoading });
  }, [config]);

  const handleSelectChange = (value: string) => {
    if (value === condition.value) {
      onChange(null);
    } else {
      onChange(value);
    }
  };

  return (
    <div className={cn("flex min-w-0", !isDisabled && COMMON_FILTER_ITEM_BORDER_CLASSNAME)}>
      <Select<IFilterOption<string>>
        getValues={() => options}
        value={selectedOption}
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
        defaultOpen={!condition.value}
      >
        {/* A flat segment of the filter chip, like the operator segment beside it. */}
        <Select.Trigger variant="select-ghost-md" appendIcon={null} className="h-full min-h-0 rounded-none">
          <SelectedOptionsDisplay<string> selectedValue={condition.value} options={options} displayCount={1} />
        </Select.Trigger>
      </Select>
    </div>
  );
});
