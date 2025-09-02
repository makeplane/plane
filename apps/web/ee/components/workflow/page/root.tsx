"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { ProjectStateLoader } from "@/components/project-states";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { WorkflowStateList } from "./workflow-state-list";

type TProjectState = {
  workspaceSlug: string;
  projectId: string;
};

export const StateWorkflowRoot: FC<TProjectState> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { projectStates } = useProjectState();

  // Loader
  if (!projectStates) return <ProjectStateLoader />;

  return (
    <div className="h-full overflow-auto vertical-scrollbar scrollbar-sm">
      <div className="flex flex-col py-3 gap-4">
        <WorkflowStateList workspaceSlug={workspaceSlug} projectId={projectId} states={projectStates} />
      </div>
    </div>
  );
});
