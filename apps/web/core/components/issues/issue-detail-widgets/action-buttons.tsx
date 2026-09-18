/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import {
  AttachOutline,
  LinkOutline,
  RelationsOutline,
  UserMinusOutline,
  UserPlusOutline,
  ViewsOutline,
} from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
// local imports
import { IssueAttachmentActionButton } from "./attachments";
import { IssueLinksActionButton } from "./links";
import { RelationActionButton } from "./relations";
import { SubIssuesActionButton } from "./sub-issues";
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
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail(issueServiceType);
  const { data: currentUser } = useUser();
  // derived values
  const issue = getIssueById(issueId);
  const isCurrentUserAssigned = !!currentUser && !!issue?.assignee_ids?.includes(currentUser.id);

  // handlers
  const handleAssignToMe = () => {
    if (!currentUser || !issue) return;

    const updatedAssigneeIds = [...(issue.assignee_ids ?? [])];
    if (isCurrentUserAssigned) {
      updatedAssigneeIds.splice(updatedAssigneeIds.indexOf(currentUser.id), 1);
    } else {
      updatedAssigneeIds.push(currentUser.id);
    }

    updateIssue(workspaceSlug, projectId, issueId, { assignee_ids: updatedAssigneeIds });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={handleAssignToMe} disabled={disabled}>
        <IssueDetailWidgetButton
          title={isCurrentUserAssigned ? t("common.actions.unassign_from_me") : t("common.actions.assign_to_me")}
          icon={
            isCurrentUserAssigned ? (
              <UserMinusOutline className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <UserPlusOutline className="h-3.5 w-3.5 flex-shrink-0" />
            )
          }
          disabled={disabled}
        />
      </button>
      {!hideWidgets?.includes("sub-work-items") && (
        <SubIssuesActionButton
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.sub_issue")}
              icon={<ViewsOutline className="h-3.5 w-3.5 flex-shrink-0" />}
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
              icon={<RelationsOutline className="h-3.5 w-3.5 flex-shrink-0" />}
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
              icon={<LinkOutline className="h-3.5 w-3.5 flex-shrink-0" />}
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
              icon={<AttachOutline className="h-3.5 w-3.5 flex-shrink-0" />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
    </div>
  );
});
