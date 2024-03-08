import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { CyclePeekOverview, CyclesListItem } from "components/cycles";

export interface ICyclesList {
  cycleIds: string[];
  workspaceSlug: string;
  projectId: string;
}

export const CyclesList: FC<ICyclesList> = observer((props) => {
  const { cycleIds, workspaceSlug, projectId } = props;

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">
          {cycleIds.map((cycleId) => (
            <CyclesListItem key={cycleId} cycleId={cycleId} workspaceSlug={workspaceSlug} projectId={projectId} />
          ))}
        </div>
        <CyclePeekOverview projectId={projectId} workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
});
