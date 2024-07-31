"use client";

import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
// icons
import { Check, Info } from "lucide-react";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list";
import { ModuleListItemAction, ModuleQuickActions } from "@/components/modules";
// helpers
import { generateQueryParams } from "@/helpers/router.helper";
// hooks
import { useModule, useProjectEstimates } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web constants
import { EEstimateSystem } from "@/plane-web/constants/estimates";

type Props = {
  moduleId: string;
};

export const ModuleListItem: React.FC<Props> = observer((props) => {
  const { moduleId } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // store hooks
  const { getModuleById } = useModule();
  const { isMobile } = usePlatformOS();
  const { currentActiveEstimateId, areEstimateEnabledByProjectId, estimateById } = useProjectEstimates();

  // derived values
  const moduleDetails = getModuleById(moduleId);

  if (!moduleDetails) return null;

  /**
   * NOTE: This completion percentage calculation is based on the total issues count.
   * when estimates are available and estimate type is points, we should consider the estimate point count
   * when estimates are available and estimate type is not points, then by default we consider the issue count
   */
  const isEstimateEnabled =
    projectId &&
    currentActiveEstimateId &&
    areEstimateEnabledByProjectId(projectId?.toString()) &&
    estimateById(currentActiveEstimateId)?.type === EEstimateSystem.POINTS;

  const completionPercentage = isEstimateEnabled
    ? ((moduleDetails?.completed_estimate_points || 0) / (moduleDetails?.total_estimate_points || 0)) * 100
    : ((moduleDetails.completed_issues + moduleDetails.cancelled_issues) / moduleDetails.total_issues) * 100;

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const completedModuleCheck = moduleDetails.status === "completed";

  // handlers
  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const query = generateQueryParams(searchParams, ["peekModule"]);
    if (searchParams.has("peekModule") && searchParams.get("peekModule") === moduleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekModule=${moduleId}`);
    }
  };

  const handleArchivedModuleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    openModuleOverview(e);
  };

  const handleItemClick = moduleDetails.archived_at ? handleArchivedModuleClick : undefined;

  return (
    <ListItem
      title={moduleDetails?.name ?? ""}
      itemLink={`/${workspaceSlug?.toString()}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}
      onItemClick={handleItemClick}
      prependTitleElement={
        <CircularProgressIndicator size={30} percentage={progress} strokeWidth={3}>
          {completedModuleCheck ? (
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
          onClick={openModuleOverview}
          className={`z-[5] flex-shrink-0 ${isMobile ? "flex" : "hidden group-hover:flex"}`}
        >
          <Info className="h-4 w-4 text-custom-text-400" />
        </button>
      }
      actionableItems={<ModuleListItemAction moduleId={moduleId} moduleDetails={moduleDetails} parentRef={parentRef} />}
      quickActionElement={
        <div className="block md:hidden">
          <ModuleQuickActions
            parentRef={parentRef}
            moduleId={moduleId}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
