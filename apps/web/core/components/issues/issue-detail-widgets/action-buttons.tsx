/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { Paperclip, Timer } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, ViewsIcon, RelationPropertyIcon } from "@plane/propel/icons";
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { IssueAttachmentActionButton } from "./attachments";
import { IssueLinksActionButton } from "./links";
import { RelationActionButton } from "./relations";
import { SubIssuesActionButton } from "./sub-issues";
import { IssueWorklogActionButton } from "./worklogs";
import { IssueDetailWidgetButton } from "./widget-button";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
};

export const IssueDetailWidgetActionButtons = observer(function IssueDetailWidgetActionButtons(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType, hideWidgets } = props;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { toggleIssueWorklogModal, setIssueWorklogData, toggleOpenWidget } = useIssueDetail(issueServiceType);
  const isTimeTrackingEnabled = Boolean(getProjectById(projectId)?.is_time_tracking_enabled);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!hideWidgets?.includes("sub-work-items") && (
        <SubIssuesActionButton
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.sub_issue")}
              icon={<ViewsIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("relations") && (
        <RelationActionButton
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.relation")}
              icon={<RelationPropertyIcon className="h-3.5 w-3.5 flex-shrink-0" />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("links") && (
        <IssueLinksActionButton
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.link")}
              icon={<LinkIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("attachments") && (
        <IssueAttachmentActionButton
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("common.attach")}
              icon={<Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("worklogs") && isTimeTrackingEnabled && (
        <IssueWorklogActionButton
          customButton={
            <IssueDetailWidgetButton
              title={t("worklog.log_time")}
              icon={<Timer className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          onClick={() => {
            setIssueWorklogData(null);
            toggleOpenWidget("worklogs");
            toggleIssueWorklogModal(true);
          }}
        />
      )}
    </div>
  );
});
