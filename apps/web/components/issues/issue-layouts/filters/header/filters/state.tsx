/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import type { IState } from "@plane/types";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  states: IState[] | undefined;
};

export const FilterState = observer(function FilterState(props: Props) {
  const { appliedFilters, handleUpdate, states } = props;
  // derived values
  const options = (states ?? []).map((state) => ({
    value: state.id,
    label: state.name,
    icon: <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.MD} percentage={state?.order} />,
  }));

  return (
    <FilterSubmenu label="State" options={options} appliedFilters={appliedFilters} onToggle={handleUpdate} searchable />
  );
});
