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
import useSWR from "swr";
import { Timer } from "lucide-react";
// helpers
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { IssueWorklogPropertyButton } from "./button";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueWorklogProperty = observer(function IssueWorklogProperty(props: TIssueWorklogProperty) {
  const { workspaceSlug, projectId, issueId } = props;
  // hooks
  const { issueWorklogTotalMinutes, isWorklogsEnabledByProjectId, getIssueWorklogTotalMinutes } =
    useWorkspaceWorklogs();
  const { peekIssue } = useIssueDetail();

  // fetching current issue total worklog count
  const { isLoading } = useSWR(
    workspaceSlug && projectId && issueId && isWorklogsEnabledByProjectId(projectId)
      ? `ISSUE_DETAIL_WORKLOG_${workspaceSlug}_${projectId}_${issueId}`
      : null,
    workspaceSlug && projectId && issueId && isWorklogsEnabledByProjectId(projectId)
      ? async () => getIssueWorklogTotalMinutes(workspaceSlug, projectId, issueId)
      : null
  );

  // derived values
  const isPeekOverview = peekIssue ? true : false;
  const totalMinutes = issueId && issueWorklogTotalMinutes[issueId] ? issueWorklogTotalMinutes[issueId] : 0;

  if (!isWorklogsEnabledByProjectId(projectId)) return <></>;
  return (
    <SidebarPropertyListItem icon={Timer} label="Tracked time" childrenClassName="px-2">
      <IssueWorklogPropertyButton
        content={convertMinutesToHoursMinutesString(totalMinutes).trim()}
        isLoading={isLoading}
      />
    </SidebarPropertyListItem>
  );
});
