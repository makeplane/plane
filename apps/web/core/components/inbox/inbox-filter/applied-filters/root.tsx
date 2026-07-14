/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// plane imports
import { Header, EHeaderVariant } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
// local imports
import { InboxIssueAppliedFiltersDate } from "./date";
import { InboxIssueAppliedFiltersLabel } from "./label";
import { InboxIssueAppliedFiltersMember } from "./member";
import { InboxIssueAppliedFiltersPriority } from "./priority";
import { InboxIssueAppliedFiltersState } from "./state";
import { InboxIssueAppliedFiltersStatus } from "./status";

export const InboxIssueAppliedFilters = observer(function InboxIssueAppliedFilters() {
  const { getAppliedFiltersCount } = useProjectInbox();
  const { t } = useTranslation();

  if (getAppliedFiltersCount === 0) return <></>;
  return (
    <Header variant={EHeaderVariant.TERNARY}>
      {/* status */}
      <InboxIssueAppliedFiltersStatus />
      {/* state */}
      <InboxIssueAppliedFiltersState />
      {/* priority */}
      <InboxIssueAppliedFiltersPriority />
      {/* assignees */}
      <InboxIssueAppliedFiltersMember filterKey="assignees" label={t("common.assignees")} />
      {/* created_by */}
      <InboxIssueAppliedFiltersMember filterKey="created_by" label={t("common.created_by")} />
      {/* label */}
      <InboxIssueAppliedFiltersLabel />
      {/* created_at */}
      <InboxIssueAppliedFiltersDate filterKey="created_at" label={t("inbox.filters.created_date")} />
      {/* updated_at */}
      <InboxIssueAppliedFiltersDate filterKey="updated_at" label={t("inbox.filters.updated_date")} />
    </Header>
  );
});
