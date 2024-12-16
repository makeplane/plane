"use client";
import React, { FC } from "react";
import { Link, Paperclip } from "lucide-react";
import { EIssueServiceType } from "@plane/constants";
// components
import { IssueAttachmentActionButton, IssueLinksActionButton } from "@/components/issues";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
};

export const EpicDetailWidgetActionButtons: FC<Props> = (props) => {
  const { workspaceSlug, projectId, epicId, disabled } = props;
  return (
    <div className="flex items-center flex-wrap gap-2">
      <IssueLinksActionButton
        issueServiceType={EIssueServiceType.EPICS}
        customButton={
          <div className="flex items-center gap-1 p-2 text-custom-text-300 hover:text-custom-text-100">
            <Link className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
            <span className="text-sm font-medium">Add link</span>
          </div>
        }
        disabled={disabled}
      />
      <IssueAttachmentActionButton
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={epicId}
        issueServiceType={EIssueServiceType.EPICS}
        customButton={
          <div className="flex items-center gap-1 p-2 text-custom-text-300 hover:text-custom-text-100">
            <Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
            <span className="text-sm font-medium">Attach</span>
          </div>
        }
        disabled={disabled}
      />
    </div>
  );
};
