/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { INBOX_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TInboxIssueStatus } from "@plane/types";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
// local imports
import { InboxStatusIcon } from "../../inbox-status-icon";

export const FilterStatus = observer(function FilterStatus() {
  // hooks
  const { currentTab, inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { t } = useTranslation();
  // derived values
  const filterValue = inboxFilters?.status || [];
  const options = INBOX_STATUS.filter(
    (s) =>
      (currentTab === "open" && [-2, 0].includes(s.status)) ||
      (currentTab === "closed" && [-1, 1, 2].includes(s.status))
  ).map((status) => ({
    value: status.status,
    label: t(status.i18n_title),
    icon: <InboxStatusIcon type={status.status} className="h-3.5 w-3.5" />,
  }));

  const handleStatusFilterSelect = (status: TInboxIssueStatus) => {
    const selectedStatus = filterValue.includes(status)
      ? filterValue.filter((v) => v !== status)
      : [...filterValue, status];
    // at least one status stays selected
    if (selectedStatus.length >= 1) handleInboxIssueFilters("status", selectedStatus);
  };

  return (
    <FilterSubmenu
      label="Work item Status"
      options={options}
      appliedFilters={filterValue}
      onToggle={handleStatusFilterSelect}
    />
  );
});
