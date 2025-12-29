import type { FC } from "react";
import React from "react";
import { Paperclip } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, ViewsIcon, RelationPropertyIcon } from "@plane/propel/icons";
// plane imports
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// plane web imports
import { WorkItemAdditionalWidgetActionButtons } from "@/plane-web/components/issues/issue-detail-widgets/action-buttons";
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

export function IssueDetailWidgetActionButtons(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType, hideWidgets } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex items-center flex-wrap gap-2">
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
      <WorkItemAdditionalWidgetActionButtons
        disabled={disabled}
        hideWidgets={hideWidgets ?? []}
        issueServiceType={issueServiceType}
        projectId={projectId}
        workItemId={issueId}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
