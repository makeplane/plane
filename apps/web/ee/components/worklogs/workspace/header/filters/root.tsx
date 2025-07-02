"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import {
  WorkspaceWorklogFilterUsers,
  WorkspaceWorklogFilterProjects,
  WorkspaceWorklogFilterDateRange,
} from "@/plane-web/components/worklogs";

type TWorkspaceWorklogFilterRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogFilterRoot: FC<TWorkspaceWorklogFilterRoot> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;

  return (
    <div className="relative flex items-center gap-2">
      <WorkspaceWorklogFilterUsers workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      <WorkspaceWorklogFilterProjects workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      <WorkspaceWorklogFilterDateRange workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
    </div>
  );
});
