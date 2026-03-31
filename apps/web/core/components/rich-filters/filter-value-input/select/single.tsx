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

import React, { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  IFilterOption,
  IFilterOptionGroup,
  TFilterProperty,
  TSingleSelectFilterFieldConfig,
  TFilterConditionNodeForDisplay,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
// local imports
import { SelectedOptionsDisplay } from "./selected-options-display";
import {
  getCommonCustomSearchSelectProps,
  getFormattedOptions,
  getFormattedGroupedOptions,
  loadOptions,
} from "./shared";

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
  // states
  const [options, setOptions] = useState<IFilterOption<string>[]>([]);
  const [groups, setGroups] = useState<IFilterOptionGroup<string>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // derived values
  const formattedOptions = useMemo(() => getFormattedOptions<string>(options), [options]);
  const formattedGroups = useMemo(() => getFormattedGroupedOptions<string>(groups), [groups]);

  useEffect(() => {
    loadOptions({ config, setOptions, setGroups, setLoading });
  }, [config]);

  const handleSelectChange = (value: string) => {
    if (value === condition.value) {
      onChange(null);
    } else {
      onChange(value);
    }
  };

  const optionsProps = formattedGroups.length > 0 ? { groupedOptions: formattedGroups } : { options: formattedOptions };

  return (
    <CustomSearchSelect
      {...getCommonCustomSearchSelectProps(isDisabled)}
      value={condition.value}
      onChange={handleSelectChange}
      {...optionsProps}
      multiple={false}
      disabled={loading || isDisabled}
      customButton={
        <SelectedOptionsDisplay<string> selectedValue={condition.value} options={options} displayCount={1} />
      }
      defaultOpen={!condition.value}
    />
  );
});
