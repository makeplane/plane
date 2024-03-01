import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { CyclePeekOverview, CyclesBoardCard } from "components/cycles";
import { EmptyState } from "components/empty-state";
// constants
import { EMPTY_STATE_DETAILS } from "constants/empty-state";

export interface ICyclesBoard {
  cycleIds: string[];
  filter: string;
  workspaceSlug: string;
  projectId: string;
  peekCycle: string | undefined;
}

export const CyclesBoard: FC<ICyclesBoard> = observer((props) => {
  const { cycleIds, filter, workspaceSlug, projectId, peekCycle } = props;

  return (
    <>
      {cycleIds?.length > 0 ? (
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
            <CyclePeekOverview
              projectId={projectId?.toString() ?? ""}
              workspaceSlug={workspaceSlug?.toString() ?? ""}
            />
          </div>
        </div>
      ) : (
        <EmptyState type={`project-cycle-${filter}` as keyof typeof EMPTY_STATE_DETAILS} size="sm" />
      )}
    </>
  );
});
