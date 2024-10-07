"use client";

import { FC, MouseEvent, useRef } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
// icons
import { Check, Info } from "lucide-react";
// types
import type { TCycleGroups } from "@plane/types";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list";
import { CycleListItemAction } from "@/components/cycles/list";
// helpers
import { generateQueryParams } from "@/helpers/router.helper";
// hooks
import { useCycle } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { CycleQuickActions } from "../quick-actions";

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

export const CyclesListItem: FC<TCyclesListItem> = observer((props) => {
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
    e.preventDefault();
    e.stopPropagation();

    const query = generateQueryParams(searchParams, ["peekCycle"]);
    if (searchParams.has("peekCycle") && searchParams.get("peekCycle") === cycleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekCycle=${cycleId}`);
    }
  };

  // handlers
  const handleArchivedCycleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    openCycleOverview(e);
  };

  const handleItemClick = cycleDetails.archived_at ? handleArchivedCycleClick : undefined;

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
