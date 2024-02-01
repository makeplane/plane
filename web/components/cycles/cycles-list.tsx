import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useUser } from "hooks/store";
// components
import { CyclePeekOverview, CyclesListItem } from "components/cycles";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { Loader } from "@plane/ui";
// constants
import { CYCLE_EMPTY_STATE_DETAILS } from "constants/cycle";

export interface ICyclesList {
  cycleIds: string[];
  filter: string;
  workspaceSlug: string;
  projectId: string;
}

export const CyclesList: FC<ICyclesList> = observer((props) => {
  const { cycleIds, filter, workspaceSlug, projectId } = props;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { currentUser } = useUser();

  const emptyStateDetail = CYCLE_EMPTY_STATE_DETAILS[filter as keyof typeof CYCLE_EMPTY_STATE_DETAILS];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("cycle", filter, isLightMode);

  return (
    <>
      {cycleIds ? (
        <>
          {cycleIds.length > 0 ? (
            <div className="h-full overflow-y-auto">
              <div className="flex h-full w-full justify-between">
                <div className="flex h-full w-full flex-col overflow-y-auto">
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
            <EmptyState
              title={emptyStateDetail.title}
              description={emptyStateDetail.description}
              image={emptyStateImage}
              size="sm"
            />
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
