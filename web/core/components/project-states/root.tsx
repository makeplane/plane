"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { ProjectStateLoader, GroupList } from "@/components/project-states";
// hooks
import { useProjectState } from "@/hooks/store";

type TProjectState = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectStateRoot: FC<TProjectState> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { groupedProjectStates, fetchProjectStates } = useProjectState();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null
  );

  // Loader
  if (!groupedProjectStates) return <ProjectStateLoader />;

  return (
    <div className="py-3">
      <GroupList workspaceSlug={workspaceSlug} projectId={projectId} groupedStates={groupedProjectStates} />
    </div>
  );
});
