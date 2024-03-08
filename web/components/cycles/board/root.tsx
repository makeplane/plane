import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { CyclePeekOverview, CyclesBoardCard } from "components/cycles";

export interface ICyclesBoard {
  cycleIds: string[];
  workspaceSlug: string;
  projectId: string;
  peekCycle: string | undefined;
}

export const CyclesBoard: FC<ICyclesBoard> = observer((props) => {
  const { cycleIds, workspaceSlug, projectId, peekCycle } = props;

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full justify-between">
        <div
          className={`grid h-full w-full grid-cols-1 gap-6 overflow-y-auto p-8 ${
            peekCycle
              ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3"
              : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
          } auto-rows-max transition-all  vertical-scrollbar scrollbar-lg`}
        >
          {cycleIds.map((cycleId) => (
            <CyclesBoardCard key={cycleId} workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />
          ))}
        </div>
        <CyclePeekOverview projectId={projectId?.toString() ?? ""} workspaceSlug={workspaceSlug?.toString() ?? ""} />
      </div>
    </div>
  );
});
