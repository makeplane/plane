"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import {
  AttachmentsCollapsible,
  LinksCollapsible,
  RelationsCollapsible,
  SubIssuesCollapsible,
} from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";
// Plane-web
import { useTimeLineRelationOptions } from "@/plane-web/components/relations";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueDetailWidgetCollapsibles: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId },
    attachment: { getAttachmentsUploadStatusByIssueId },
    relation: { getRelationCountByIssueId },
  } = useIssueDetail();

  // derived values
  const issue = getIssueById(issueId);
  const subIssues = subIssuesByIssueId(issueId);
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  const issueRelationsCount = getRelationCountByIssueId(issueId, ISSUE_RELATION_OPTIONS);

  // render conditions
  const shouldRenderSubIssues = !!subIssues && subIssues.length > 0;
  const shouldRenderRelations = issueRelationsCount > 0;
  const shouldRenderLinks = !!issue?.link_count && issue?.link_count > 0;
  const attachmentUploads = getAttachmentsUploadStatusByIssueId(issueId);
  const shouldRenderAttachments =
    (!!issue?.attachment_count && issue?.attachment_count > 0) || (!!attachmentUploads && attachmentUploads.length > 0);

  return (
    <div className="flex flex-col">
      {shouldRenderSubIssues && (
        <SubIssuesCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      )}
      {shouldRenderRelations && (
        <RelationsCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      )}
      {shouldRenderLinks && (
        <LinksCollapsible workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
      )}
      {shouldRenderAttachments && (
        <AttachmentsCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      )}
    </div>
  );
});
