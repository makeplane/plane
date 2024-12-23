"use client";
import React, { FC } from "react";
import { EIssueServiceType } from "@plane/constants";
import { SubIssuesCollapsibleContent } from "@/components/issues";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicIssuesOverviewRoot: FC<Props> = (props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  return (
    <>
      <SubIssuesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={epicId}
        disabled={disabled}
        issueServiceType={EIssueServiceType.EPICS}
      />
    </>
  );
};
