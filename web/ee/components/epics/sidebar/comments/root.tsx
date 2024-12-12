"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { TActivityOperations } from "@/components/issues";
// hooks
import { useProject } from "@/hooks/store";
// components
import { EpicCommentActivityRoot } from "../activity/comments/root";
// services
import { EpicCommentCreate } from "./create";

type TEpicSidebarCommentsRootProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
  activityOperations: TActivityOperations;
};

export const EpicSidebarCommentsRoot: FC<TEpicSidebarCommentsRootProps> = observer((props) => {
  const { workspaceSlug, projectId, epicId, activityOperations, disabled = false } = props;
  // hooks
  const { getProjectById } = useProject();

  const project = getProjectById(projectId);
  if (!project) return <></>;

  return (
    <div className="space-y-3">
      <div className="min-h-[200px]">
        <div className="space-y-3">
          {!disabled && (
            <EpicCommentCreate
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              epicId={epicId}
              activityOperations={activityOperations}
              showAccessSpecifier={!!project.anchor}
            />
          )}
          <EpicCommentActivityRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={epicId}
            activityOperations={activityOperations}
            showAccessSpecifier={!!project.anchor}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
});
