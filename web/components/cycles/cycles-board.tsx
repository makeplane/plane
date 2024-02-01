import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useUser } from "hooks/store";
// components
import { CyclePeekOverview, CyclesBoardCard } from "components/cycles";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// constants
import { CYCLE_EMPTY_STATE_DETAILS } from "constants/cycle";

export interface ICyclesBoard {
  cycleIds: string[];
  filter: string;
  workspaceSlug: string;
  projectId: string;
  peekCycle: string | undefined;
}

export const CyclesBoard: FC<ICyclesBoard> = observer((props) => {
  const { cycleIds, filter, workspaceSlug, projectId, peekCycle } = props;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { currentUser } = useUser();

  const emptyStateDetail = CYCLE_EMPTY_STATE_DETAILS[filter as keyof typeof CYCLE_EMPTY_STATE_DETAILS];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("cycle", filter, isLightMode);

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
              } auto-rows-max transition-all `}
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
        <EmptyState
          title={emptyStateDetail.title}
          description={emptyStateDetail.description}
          image={emptyStateImage}
          size="sm"
        />
      )}
    </>
  );
});
