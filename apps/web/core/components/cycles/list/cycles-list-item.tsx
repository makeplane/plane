"use client";
import { useRef } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
// plane imports
import type { TCycleGroups } from "@plane/types";
import { CircularProgressIndicator } from "@plane/ui";
// components
import { generateQueryParams } from "@plane/utils";
import { ListItem } from "@/components/core/list";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { CycleQuickActions } from "../quick-actions";
import { CycleListItemAction } from "./cycle-list-item-action";

type TCyclesListItem = {
  cycleId: string;
  handleEditCycle?: () => void;
  handleDeleteCycle?: () => void;
  handleAddToFavorites?: () => void;
  handleRemoveFromFavorites?: () => void;
  workspaceSlug: string;
  projectId: string;
  className?: string;
};

export const CyclesListItem: React.FC<TCyclesListItem> = observer((props) => {
  const { cycleId, workspaceSlug, projectId, className = "" } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
  const isActive = cycleStatus === "current";

  // handlers
  const openCycleOverview = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const query = generateQueryParams(searchParams, ["peekCycle"]);
    if (searchParams.has("peekCycle") && searchParams.get("peekCycle") === cycleId) {
      router.push(`${pathname}?${query}`, { showProgress: false });
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekCycle=${cycleId}`, { showProgress: false });
    }
  };

  // handlers
  const handleArchivedCycleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    openCycleOverview(e);
  };

  const handleItemClick = cycleDetails.archived_at ? handleArchivedCycleClick : undefined;

  const getCycleProgress = () => {
    let completionPercentage =
      ((cycleDetails.completed_issues + cycleDetails.cancelled_issues) / cycleDetails.total_issues) * 100;

    if (isCompleted && !isEmpty(cycleDetails.progress_snapshot)) {
      completionPercentage =
        ((cycleDetails.progress_snapshot.completed_issues + cycleDetails.progress_snapshot.cancelled_issues) /
          cycleDetails.progress_snapshot.total_issues) *
        100;
    }
    return isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);
  };

  const progress = getCycleProgress();

  return (
    <ListItem
      title={cycleDetails?.name ?? ""}
      itemLink={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}
      onItemClick={handleItemClick}
      className={className}
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
      actionableItems={
        <CycleListItemAction
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          cycleId={cycleId}
          cycleDetails={cycleDetails}
          parentRef={parentRef}
          isActive={isActive}
        />
      }
      quickActionElement={
        <div className="block md:hidden">
          <CycleQuickActions
            parentRef={parentRef}
            cycleId={cycleId}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
      isSidebarOpen={searchParams.has("peekCycle")}
    />
  );
});
