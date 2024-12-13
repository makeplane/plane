"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ProjectActivityCommentRoot } from "./activity-comment-root";
// components

type TProjectActivity = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectActivity: FC<TProjectActivity> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  return (
    <div className="space-y-4 pt-3">
      {/* rendering activity */}
      <div className="space-y-3">
        <div className="min-h-[200px]">
          <div className="space-y-3">
            <ProjectActivityCommentRoot projectId={projectId} workspaceSlug={workspaceSlug} />
          </div>
        </div>
      </div>
    </div>
  );
});
