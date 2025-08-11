"use client";

import React, { FC, useRef } from "react";
import { format, startOfToday } from "date-fns";
// types
// icons
import { ICycle, TCycleProgress } from "@plane/types";
import { BetaBadge, ControlLink, Loader, Tooltip } from "@plane/ui";
import { CycleListItemAction } from "@/components/cycles";
// helpers
import { findHowManyDaysLeft } from "@plane/utils";
import { useAppRouter } from "@/hooks/use-app-router";
import ProgressDonut from "./progress-donut";

type Props = {
  progress: Partial<TCycleProgress>[] | null;
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: ICycle;
};

export const CycleProgressHeader: FC<Props> = (props: Props) => {
  const { workspaceSlug, projectId, cycleId, progress, cycleDetails } = props;

  // router
  const router = useAppRouter();
  const parentRef = useRef(null);
  const progressToday = progress && progress.find((d) => d.date === format(startOfToday(), "yyyy-MM-dd"));
  // handlers
  const handleControlLinkClick = () => {
    router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`, { showProgress: false });
  };

  const handleEventPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <ControlLink
      onClick={handleControlLinkClick}
      href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}
    >
      <div className="px-page-x flex items-center justify-between py-4 bg-custom-sidebar-background-100 w-full">
        <div className="flex gap-6 h-full truncate">
          {progress === null && <Loader.Item width="65px" height="65px" className="flex-shrink-0 rounded-full" />}
          {progress && (
            <ProgressDonut progress={progressToday} days_left={findHowManyDaysLeft(cycleDetails.end_date) ?? 0} />
          )}
          <div className="flex flex-col h-full my-auto w-full overflow-hidden">
            <div className="flex gap-2 items-center">
              <div className="text-xs text-custom-primary-200 font-medium">Currently active cycle</div>
              <BetaBadge />
            </div>
            <Tooltip tooltipContent={cycleDetails.name} position="bottom-right">
              <div className="inline-block line-clamp-1 truncate font-bold text-custom-text-100 my-1 text-[20px] text-left">
                {cycleDetails.name}
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="flex shrink-0 gap-4 items-center" onClick={handleEventPropagation}>
          <CycleListItemAction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            cycleId={cycleId}
            cycleDetails={cycleDetails}
            parentRef={parentRef}
            isActive
          />
        </div>
      </div>
    </ControlLink>
  );
};
