/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// i18n
import { useTranslation } from "@plane/i18n";
// ui
import { DueDatePropertyIcon } from "@plane/propel/icons";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";

type TCompletedAtPropertyProps = {
  issueId: string;
};

export const CompletedAtProperty = observer(function CompletedAtProperty({ issueId }: TCompletedAtPropertyProps) {
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();

  const issue = getIssueById(issueId);
  if (!issue) return null;

  const stateDetails = getStateById(issue.state_id);

  if (stateDetails?.group !== "completed") return null;

  // Fall back to now if backend hasn't returned completed_at yet (optimistic state update)
  const completedAt = issue.completed_at ?? new Date().toISOString();

  return (
    <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.completed_at")} childrenClassName="h-7.5">
      <span className="px-2 text-body-xs-regular text-secondary-200">
        {renderFormattedDate(completedAt)} {renderFormattedTime(completedAt, "12-hour")}
      </span>
    </SidebarPropertyListItem>
  );
});
