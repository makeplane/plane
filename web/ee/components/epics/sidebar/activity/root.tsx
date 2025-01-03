"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { TActivityOperations } from "@/components/issues";
import { useProject } from "@/hooks/store";
// services
import { EActivityFilterType } from "@/plane-web/constants";
import { EpicActivityCommentRoot } from "./activity-root";

type TEpicDetailActivityRootProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityOperations: TActivityOperations;
  disabled?: boolean;
};

export const EpicSidebarActivityRoot: FC<TEpicDetailActivityRootProps> = observer((props) => {
  const { workspaceSlug, projectId, issueId, activityOperations, disabled = false } = props;
  // hooks
  const { getProjectById } = useProject();

  const project = getProjectById(projectId);
  if (!project) return <></>;

  return (
    <div className="space-y-3">
      <div className="min-h-[200px]">
        <div className="space-y-3">
          <EpicActivityCommentRoot
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            issueId={issueId}
            selectedFilters={[EActivityFilterType.ACTIVITY]}
            activityOperations={activityOperations}
            showAccessSpecifier={!!project.anchor}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
});
