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

import type { FC } from "react";
import { observer } from "mobx-react";
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
      <InboxIssueAppliedFiltersMember filterKey="assignees" label="Assignees" />
      {/* created_by */}
      <InboxIssueAppliedFiltersMember filterKey="created_by" label="Created By" />
      {/* label */}
      <InboxIssueAppliedFiltersLabel />
      {/* created_at */}
      <InboxIssueAppliedFiltersDate filterKey="created_at" label="Created date" />
      {/* updated_at */}
      <InboxIssueAppliedFiltersDate filterKey="updated_at" label="Updated date" />
    </Header>
  );
});
