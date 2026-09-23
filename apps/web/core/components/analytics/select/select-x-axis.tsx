/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane package imports
import { Select } from "@plane/blocks/select";
import type { ChartXAxisProperty } from "@plane/types";

/** `null` is a real selectable value here (`allowNoValue`), so it needs an id the Select can key on. */
const NO_VALUE_ID = "__no_value__";

type XAxisOption = {
  id: string;
  label: string;
  value: ChartXAxisProperty | null;
};

type Props = {
  value?: ChartXAxisProperty;
  onChange: (val: ChartXAxisProperty | null) => void;
  options: { value: ChartXAxisProperty; label: string }[];
  placeholder?: string;
  hiddenOptions?: ChartXAxisProperty[];
  allowNoValue?: boolean;
  label?: string | React.ReactNode;
};

export function SelectXAxis(props: Props) {
  const { value, onChange, options, hiddenOptions, allowNoValue, label } = props;
  // derived values
  const selectOptions = useMemo<XAxisOption[]>(() => {
    const visible = options
      .filter((item) => !hiddenOptions?.includes(item.value))
      .map((item) => ({ id: item.value, label: item.label, value: item.value }));
    return allowNoValue ? [{ id: NO_VALUE_ID, label: "No value", value: null }, ...visible] : visible;
  }, [options, hiddenOptions, allowNoValue]);
  const selected = useMemo(
    () => selectOptions.find((option) => option.value === value) ?? null,
    [selectOptions, value]
  );

  return (
    <Select<XAxisOption>
      getValues={() => selectOptions}
      value={selected}
      onChange={(id) => onChange(selectOptions.find((option) => option.id === id)?.value ?? null)}
      getOptionValue={(option) => option.id}
      getOptionLabel={(option) => option.label}
      showSearch={false}
      pinSelected={false}
    >
      <Select.Trigger variant="select-md" className="w-auto">
        {label}
      </Select.Trigger>
    </Select>
  );
}
