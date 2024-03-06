import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { CyclePeekOverview, CyclesListItem } from "components/cycles";
import { EmptyState } from "components/empty-state";
// ui
import { Loader } from "@plane/ui";
// constants
import { EMPTY_STATE_DETAILS } from "constants/empty-state";

export interface ICyclesList {
  cycleIds: string[];
  filter: string;
  workspaceSlug: string;
  projectId: string;
}

export const CyclesList: FC<ICyclesList> = observer((props) => {
  const { cycleIds, filter, workspaceSlug, projectId } = props;

  return (
    <>
      {cycleIds ? (
        <>
          {cycleIds.length > 0 ? (
            <div className="h-full overflow-y-auto">
              <div className="flex h-full w-full justify-between">
                <div className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">
                  {cycleIds.map((cycleId) => (
                    <CyclesListItem
                      key={cycleId}
                      cycleId={cycleId}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                    />
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
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
        </Loader>
      )}
    </>
  );
});
