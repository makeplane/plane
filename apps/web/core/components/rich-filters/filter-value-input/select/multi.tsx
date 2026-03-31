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
  SingleOrArray,
  IFilterOption,
  IFilterOptionGroup,
  TFilterProperty,
  TMultiSelectFilterFieldConfig,
  TFilterConditionNodeForDisplay,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { toFilterArray, getFilterValueLength } from "@plane/utils";
// local imports
import { SelectedOptionsDisplay } from "./selected-options-display";
import {
  getCommonCustomSearchSelectProps,
  getFormattedOptions,
  getFormattedGroupedOptions,
  loadOptions,
} from "./shared";

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
  const [groups, setGroups] = useState<IFilterOptionGroup<string>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // derived values
  const formattedOptions = useMemo(() => getFormattedOptions<string>(options), [options]);
  const formattedGroups = useMemo(() => getFormattedGroupedOptions<string>(groups), [groups]);

  useEffect(() => {
    loadOptions({ config, setOptions, setGroups, setLoading });
  }, [config]);

  const handleSelectChange = (values: string[]) => {
    onChange(values);
  };

  const optionsProps = formattedGroups.length > 0 ? { groupedOptions: formattedGroups } : { options: formattedOptions };

  return (
    <CustomSearchSelect
      {...getCommonCustomSearchSelectProps(isDisabled)}
      value={toFilterArray(condition.value)}
      onChange={handleSelectChange}
      {...optionsProps}
      multiple
      disabled={loading || isDisabled}
      customButton={<SelectedOptionsDisplay<string> selectedValue={condition.value} options={options} />}
      defaultOpen={getFilterValueLength(condition.value) === 0}
    />
  );
});
