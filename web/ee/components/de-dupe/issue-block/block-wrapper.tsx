"use-client";

import React, { FC } from "react";
// types
import { TDeDupeIssue } from "@plane/types";
// ui
import { ControlLink } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TDeDupeIssueBlockWrapperProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
  children: React.ReactNode;
  isSelected?: boolean;
};

export const DeDupeIssueBlockWrapper: FC<TDeDupeIssueBlockWrapperProps> = (props) => {
  const { workspaceSlug, issue, isSelected = false, children } = props;
  // handlers
  const handleRedirection = () =>
    window.open(`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`, "_blank");

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
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
};
