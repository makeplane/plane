/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IIssueLabel } from "@plane/types";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  labels: IIssueLabel[] | undefined;
};

export const FilterLabels = observer(function FilterLabels(props: Props) {
  const { labels } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filterValue = inboxFilters?.labels || [];
  const options = (labels ?? []).map((item) => ({
    value: item.id,
    label: item.name,
    icon: <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />,
  }));

  const handleToggle = (value: string) =>
    handleInboxIssueFilters(
      "labels",
      filterValue.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value]
    );

  return (
    <FilterSubmenu label="Label" options={options} appliedFilters={filterValue} onToggle={handleToggle} searchable />
  );
});
