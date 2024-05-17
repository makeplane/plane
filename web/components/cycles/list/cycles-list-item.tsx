import { FC, MouseEvent, useRef } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { Check, Info } from "lucide-react";
// types
import type { TCycleGroups } from "@plane/types";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list";
import { CycleListItemAction } from "@/components/cycles/list";
// hooks
import { useCycle } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TCyclesListItem = {
  cycleId: string;
  handleEditCycle?: () => void;
  handleDeleteCycle?: () => void;
  handleAddToFavorites?: () => void;
  handleRemoveFromFavorites?: () => void;
  workspaceSlug: string;
  projectId: string;
};

export const CyclesListItem: FC<TCyclesListItem> = observer((props) => {
  const { cycleId, workspaceSlug, projectId } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useRouter();
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const { getCycleById } = useCycle();

  // derived values
  const cycleDetails = getCycleById(cycleId);

  if (!cycleDetails) return null;

  // computed
  // TODO: change this logic once backend fix the response
  const cycleStatus = cycleDetails.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const isCompleted = cycleStatus === "completed";

  const cycleTotalIssues =
    cycleDetails.backlog_issues +
    cycleDetails.unstarted_issues +
    cycleDetails.started_issues +
    cycleDetails.completed_issues +
    cycleDetails.cancelled_issues;

  const completionPercentage = (cycleDetails.completed_issues / cycleTotalIssues) * 100;

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  // handlers
  const openCycleOverview = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const { query } = router;
    e.preventDefault();
    e.stopPropagation();

    if (query.peekCycle) {
      delete query.peekCycle;
      router.push({
        pathname: router.pathname,
        query: { ...query },
      });
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekCycle: cycleId },
      });
    }
  };

  return (
    <ListItem
      title={cycleDetails?.name ?? ""}
      itemLink={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}
      onItemClick={(e) => {
        if (cycleDetails.archived_at) openCycleOverview(e);
      }}
      prependTitleElement={
        <CircularProgressIndicator size={30} percentage={progress} strokeWidth={3}>
          {isCompleted ? (
            progress === 100 ? (
              <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
            ) : (
              <span className="text-sm text-custom-primary-100">{`!`}</span>
            )
          ) : progress === 100 ? (
            <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
          ) : (
            <span className="text-[9px] text-custom-text-300">{`${progress}%`}</span>
          )}
        </CircularProgressIndicator>
      }
      appendTitleElement={
        <button
          onClick={openCycleOverview}
          className={`z-[5] flex-shrink-0 ${isMobile ? "flex" : "hidden group-hover:flex"}`}
        >
          <Info className="h-4 w-4 text-custom-text-400" />
        </button>
      }
      actionableItems={
        <CycleListItemAction
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          cycleId={cycleId}
          cycleDetails={cycleDetails}
          parentRef={parentRef}
        />
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
