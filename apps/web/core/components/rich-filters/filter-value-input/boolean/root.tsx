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

import React, { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type {
  TFilterProperty,
  TFilterConditionNodeForDisplay,
  IFilterOption,
  TBooleanFilterFieldConfig,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
// components
import { SelectedOptionsDisplay } from "@/components/rich-filters/filter-value-input/select/selected-options-display";
import {
  getCommonCustomSearchSelectProps,
  getFormattedOptions,
} from "@/components/rich-filters/filter-value-input/select/shared";

type TBooleanFilterValueInputProps<P extends TFilterProperty> = {
  config: TBooleanFilterFieldConfig;
  condition: TFilterConditionNodeForDisplay<P, boolean>;
  isDisabled?: boolean;
  onChange: (value: boolean | null) => void;
};

const OPTIONS: IFilterOption<boolean>[] = [
  {
    id: "true",
    label: "True",
    value: true,
  },
  {
    id: "false",
    label: "False",
    value: false,
  },
];

export const BooleanFilterValueInput = observer(function BooleanFilterValueInput<P extends TFilterProperty>(
  props: TBooleanFilterValueInputProps<P>
) {
  const { condition, onChange, isDisabled } = props;
  // derived values
  const formattedOptions = useMemo(() => getFormattedOptions<boolean>(OPTIONS), []);

  const handleSelectChange = (value: boolean) => {
    if (value === condition.value) {
      onChange(null);
    } else {
      onChange(value);
    }
  };

  return (
    <CustomSearchSelect
      {...getCommonCustomSearchSelectProps(isDisabled)}
      value={condition.value}
      onChange={handleSelectChange}
      options={formattedOptions}
      multiple={false}
      disabled={isDisabled}
      customButton={
        <SelectedOptionsDisplay<boolean> selectedValue={condition.value} options={OPTIONS} displayCount={1} />
      }
      defaultOpen={condition.value === null || condition.value === undefined}
    />
  );
});
