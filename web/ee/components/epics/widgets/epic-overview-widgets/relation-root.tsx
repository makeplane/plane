"use client";
import React, { FC } from "react";
import { EIssueServiceType } from "@plane/constants";
import { RelationsCollapsibleContent } from "@/components/issues";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicRelationsOverviewRoot: FC<Props> = (props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  return (
    <>
      <RelationsCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={epicId}
        disabled={disabled}
        issueServiceType={EIssueServiceType.EPICS}
      />
    </>
  );
};
