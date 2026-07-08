/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { formatWorklogDuration } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorklog } from "@/hooks/store/use-worklog";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueWorklogProperty = observer(function IssueWorklogProperty(props: TIssueWorklogProperty) {
  const { workspaceSlug, projectId, issueId } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { fetchWorklogs, getTotalMinutesByIssueId } = useWorklog();
  // derived values
  const currentProjectDetails = getProjectById(projectId);
  const isTimeTrackingEnabled = Boolean(currentProjectDetails?.is_time_tracking_enabled);

  // load the worklog entries for the work item once (SWR dedups with the activity call-sites)
  useSWR(
    workspaceSlug && projectId && issueId && isTimeTrackingEnabled
      ? `WORKLOGS_${workspaceSlug}_${projectId}_${issueId}`
      : null,
    workspaceSlug && projectId && issueId && isTimeTrackingEnabled
      ? () => fetchWorklogs(workspaceSlug, projectId, issueId)
      : null
  );

  if (!isTimeTrackingEnabled) return null;

  const totalMinutes = getTotalMinutesByIssueId(issueId);

  return (
    <SidebarPropertyListItem icon={Timer} label={t("time_tracking")}>
      <span className="text-body-xs-regular text-secondary">
        {totalMinutes > 0 ? formatWorklogDuration(totalMinutes) : "—"}
      </span>
    </SidebarPropertyListItem>
  );
});
