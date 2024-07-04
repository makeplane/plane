import { FC } from "react";
import { observer } from "mobx-react";
// types
import { IActiveCycle } from "@plane/types";
// components
import { ActiveCycleStats } from "@/components/cycles";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import {
  ActiveCyclesProjectTitle,
  ActiveCycleHeader,
  ActiveCycleProgress,
  ActiveCycleProductivity,
} from "@/plane-web/components/cycles";

export type ActiveCycleInfoProps = {
  cycle: IActiveCycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfo: FC<ActiveCycleInfoProps> = observer((props) => {
  const { cycle, workspaceSlug, projectId } = props;

  const { getProjectById } = useProject();

  const projectDetails = getProjectById(projectId);

  if (!projectDetails) return null;

  return (
    <>
      <ActiveCyclesProjectTitle project={projectDetails} />
      <div className="flex flex-col gap-2 rounded border border-custom-border-200">
        <ActiveCycleHeader cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ActiveCycleProgress cycle={cycle} />
          <ActiveCycleProductivity cycle={cycle} />
          <ActiveCycleStats cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      </div>
    </>
  );
});
