"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { TIssueServiceType } from "@plane/types";
// components
import {
  AttachmentsCollapsible,
  LinksCollapsible,
  RelationsCollapsible,
  SubIssuesCollapsible,
  TWorkItemWidgets,
} from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";
// Plane-web
import { WorkItemAdditionalWidgets } from "@/plane-web/components/issues/issue-detail-widgets";
import { useTimeLineRelationOptions } from "@/plane-web/components/relations";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
};

export const IssueDetailWidgetCollapsibles: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType, hideWidgets } = props;
  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId },
    attachment: { getAttachmentsCountByIssueId, getAttachmentsUploadStatusByIssueId },
    relation: { getRelationCountByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const issue = getIssueById(issueId);
  const subIssues = subIssuesByIssueId(issueId);
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  const issueRelationsCount = getRelationCountByIssueId(issueId, ISSUE_RELATION_OPTIONS);
  // render conditions
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
      <WorkItemAdditionalWidgets
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        workItemId={issueId}
        disabled={disabled}
      />
    </div>
  );
});
