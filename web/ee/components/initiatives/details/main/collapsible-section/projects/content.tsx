"use client";

import React, { FC } from "react";
//
import { ProjectList } from "./project-list";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  projectIds: string[];
  disabled: boolean;
};

export const InitiativeProjectsCollapsibleContent: FC<Props> = (props) => {
  const { workspaceSlug, initiativeId, projectIds, disabled } = props;
  return (
    <div className="mt-3">
      <ProjectList
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        projectIds={projectIds}
        disabled={disabled}
      />
    </div>
  );
};
