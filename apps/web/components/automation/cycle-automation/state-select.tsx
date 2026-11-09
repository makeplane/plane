/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** State pickers for the cycle automation rules and the "Move work items" dialog. */

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import { Select } from "@plane/blocks/select";
import type { IState } from "@plane/types";

const stateIcon = (state: IState) => (
  <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.LG} />
);

type TMultiProps = {
  states: IState[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  disabled?: boolean;
};

export const StateMultiSelect = observer(function StateMultiSelect(props: TMultiProps) {
  const { states, value, onChange, placeholder, disabled } = props;
  const selected = useMemo(() => states.filter((state) => value.includes(state.id)), [states, value]);
  return (
    <Select<IState>
      multiple
      getValues={() => states}
      value={selected}
      onChange={(next) => onChange(next)}
      getOptionValue={(state) => state.id}
      getOptionLabel={(state) => state.name}
      getOptionIcon={stateIcon}
      disabled={disabled}
    >
      <Select.Trigger<IState> variant="select-md" disabled={disabled}>
        {(options) => (
          <span className="grow truncate">
            {options.length ? options.map((state) => state.name).join(", ") : placeholder}
          </span>
        )}
      </Select.Trigger>
    </Select>
  );
});

type TSingleProps = {
  states: IState[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
};

export const StateSingleSelect = observer(function StateSingleSelect(props: TSingleProps) {
  const { states, value, onChange, placeholder, disabled } = props;
  const selected = states.find((state) => state.id === value) ?? null;
  return (
    <Select<IState>
      getValues={() => states}
      value={selected}
      onChange={(next) => onChange(next)}
      getOptionValue={(state) => state.id}
      getOptionLabel={(state) => state.name}
      getOptionIcon={stateIcon}
      disabled={disabled}
    >
      <Select.Trigger variant="select-md" disabled={disabled}>
        {selected ? (
          <>
            {stateIcon(selected)}
            <span className="grow truncate">{selected.name}</span>
          </>
        ) : (
          <span className="grow truncate text-placeholder">{placeholder}</span>
        )}
      </Select.Trigger>
    </Select>
  );
});
