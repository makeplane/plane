"use-client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// types
import { TDeDupeIssue } from "@plane/types";
// ui
import { ControlLink } from "@plane/ui";
// helpers
import { cn, generateWorkItemLink } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";

type TDeDupeIssueBlockWrapperProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
  children: React.ReactNode;
  isSelected?: boolean;
};

export const DeDupeIssueBlockWrapper: FC<TDeDupeIssueBlockWrapperProps> = observer((props) => {
  const { workspaceSlug, issue, isSelected = false, children } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();

  // derived values
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
  });

  // handlers
  const handleRedirection = () => window.open(workItemLink, "_blank");

  return (
    <ControlLink
      href={workItemLink}
      className={cn(
        "group relative flex flex-col gap-3.5 w-80  rounded-lg px-3 py-2 bg-custom-background-100 border border-custom-primary-100/10",
        {
          "border-custom-primary-100/50 ": isSelected,
        }
      )}
      onClick={handleRedirection}
    >
      {children}
    </ControlLink>
  );
});
