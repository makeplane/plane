/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useTimeLineRelationOptions } from "@/components/relations";
// local imports
import { AttachmentsCollapsible } from "./attachments";
import { LinksCollapsible } from "./links";
import { PomodoroCollapsible } from "./pomodoro";
import { RelationsCollapsible } from "./relations";
import { SubIssuesCollapsible } from "./sub-issues";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
};

export const IssueDetailWidgetCollapsibles = observer(function IssueDetailWidgetCollapsibles(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType, hideWidgets } = props;
  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId },
    attachment: { getAttachmentsCountByIssueId, getAttachmentsUploadStatusByIssueId },
    relation: { getRelationCountByIssueId },
  } = useIssueDetail(issueServiceType);
  const { getProjectById } = useProject();
  // derived values
  const issue = getIssueById(issueId);
  const subIssues = subIssuesByIssueId(issueId);
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  const issueRelationsCount = getRelationCountByIssueId(issueId, ISSUE_RELATION_OPTIONS);
  const projectDetails = issue?.project_id ? getProjectById(issue.project_id) : undefined;
  // render conditions
  const shouldRenderPomodoro =
    (projectDetails?.is_time_tracking_enabled ?? false) && !hideWidgets?.includes("pomodoro");
  const shouldRenderSubIssues = !!subIssues && subIssues.length > 0 && !hideWidgets?.includes("sub-work-items");
  const shouldRenderRelations = issueRelationsCount > 0 && !hideWidgets?.includes("relations");
  const shouldRenderLinks = !!issue?.link_count && issue?.link_count > 0 && !hideWidgets?.includes("links");
  const attachmentUploads = getAttachmentsUploadStatusByIssueId(issueId);
  const attachmentsCount = getAttachmentsCountByIssueId(issueId);
  const shouldRenderAttachments =
    attachmentsCount > 0 ||
    (!!attachmentUploads && attachmentUploads.length > 0 && !hideWidgets?.includes("attachments"));

  return (
    <div className="flex flex-col">
      {shouldRenderPomodoro && (
        <PomodoroCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderSubIssues && (
        <SubIssuesCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderRelations && (
        <RelationsCollapsible
          workspaceSlug={workspaceSlug}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderLinks && (
        <LinksCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderAttachments && (
        <AttachmentsCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
    </div>
  );
});
