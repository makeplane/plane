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
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  states: IState[] | undefined;
};

export const FilterState = observer(function FilterState(props: Props) {
  const { states } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filterValue = inboxFilters?.state || [];
  const options = (states ?? []).map((item) => ({
    value: item.id,
    label: item.name,
    icon: <StateGroupIcon stateGroup={item.group} color={item.color} size={EIconSize.MD} percentage={item.order} />,
  }));

  const handleToggle = (value: string) =>
    handleInboxIssueFilters(
      "state",
      filterValue.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value]
    );

  return (
    <FilterSubmenu label="State" options={options} appliedFilters={filterValue} onToggle={handleToggle} searchable />
  );
});
