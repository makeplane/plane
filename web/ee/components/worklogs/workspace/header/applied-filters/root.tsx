"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import {
  WorkspaceWorklogAppliedFilterUsers,
  WorkspaceWorklogAppliedFilterProjects,
  WorkspaceWorklogAppliedFilterDateRange,
} from "@/plane-web/components/worklogs";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogAppliedFilterRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogAppliedFilterRoot: FC<TWorkspaceWorklogAppliedFilterRoot> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
  // hooks
  const { filters } = useWorkspaceWorklogs();

  // derived values
  const isAppliedFilters = Object.values(filters).some((filter) => filter.length > 0);

  if (!isAppliedFilters) return <></>;
  return (
    <div className="relative flex items-center flex-wrap gap-2 rounded p-2 bg-custom-background-90">
      <WorkspaceWorklogAppliedFilterUsers workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      <WorkspaceWorklogAppliedFilterProjects workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      <WorkspaceWorklogAppliedFilterDateRange workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
    </div>
  );
});
