"use client";
import React, { FC } from "react";
import { Layers, Link, Paperclip, Waypoints } from "lucide-react";
// components
import {
  IssueAttachmentActionButton,
  IssueLinksActionButton,
  RelationActionButton,
  SubIssuesActionButton,
  IssueDetailWidgetButton,
} from "@/components/issues/issue-detail-widgets";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueDetailWidgetActionButtons: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  return (
    <div className="flex items-center flex-wrap gap-2">
      <SubIssuesActionButton
        issueId={issueId}
        customButton={
          <IssueDetailWidgetButton
            title="Add sub-issue"
            icon={<Layers className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
            disabled={disabled}
          />
        }
        disabled={disabled}
      />
      <RelationActionButton
        issueId={issueId}
        customButton={
          <IssueDetailWidgetButton
            title="Add relation"
            icon={<Waypoints className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
            disabled={disabled}
          />
        }
        disabled={disabled}
      />
      <IssueLinksActionButton
        customButton={
          <IssueDetailWidgetButton
            title="Add link"
            icon={<Link className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
            disabled={disabled}
          />
        }
        disabled={disabled}
      />
      <IssueAttachmentActionButton
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        customButton={
          <IssueDetailWidgetButton
            title="Attach"
            icon={<Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
            disabled={disabled}
          />
        }
        disabled={disabled}
      />
    </div>
  );
};
