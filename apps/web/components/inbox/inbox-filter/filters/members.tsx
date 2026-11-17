/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TInboxIssueFilterMemberKeys } from "@plane/types";
// components
import { MemberFilterSubmenu } from "@/components/common/filters/member-filter-submenu";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  filterKey: TInboxIssueFilterMemberKeys;
  label?: string;
  memberIds: string[] | undefined;
};

export const FilterMember = observer(function FilterMember(props: Props) {
  const { filterKey, label = "Members", memberIds } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // derived values
  const filterValue = inboxFilters?.[filterKey] || [];

  const handleToggle = (value: string) =>
    handleInboxIssueFilters(
      filterKey,
      filterValue.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value]
    );

  return (
    <MemberFilterSubmenu label={label} memberIds={memberIds} appliedFilters={filterValue} onToggle={handleToggle} />
  );
});
