"use client";

import React, { FC, useRef } from "react";
import { format, parseISO, startOfToday } from "date-fns";
// types
import { ArrowRight, CalendarDays } from "lucide-react";
// icons
import { TCycleProgress } from "@plane/types";
import { ControlLink, Loader } from "@plane/ui";
import { CycleListItemAction } from "@/components/cycles";
// helpers
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { cn } from "@/helpers/common.helper";
import { findHowManyDaysLeft } from "@/helpers/date-time.helper";
import { useMember } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import ProgressDonut from "./progress-donut";

type Props = {
  progress: Partial<TCycleProgress>[] | null;
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: any;
  progressLoader: boolean;
};

export const CycleProgressHeader: FC<Props> = (props: Props) => {
  const { workspaceSlug, projectId, cycleId, progress, cycleDetails, progressLoader } = props;
  const { getUserDetails } = useMember();

  // router
  const router = useAppRouter();
  const parentRef = useRef(null);
  const createdByDetails = cycleDetails.created_by ? getUserDetails(cycleDetails.created_by) : undefined;
  const progressToday = progress && progress.find((d) => d.date === format(startOfToday(), "yyyy-MM-dd"));
  // handlers
  const handleControlLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`);
  };

  return (
    <ControlLink
      onClick={handleControlLinkClick}
      href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}
      className={cn("px-page-x flex items-center justify-between py-4 bg-custom-sidebar-background-100")}
    >
      <div className="flex gap-6 h-full rounded-full">
        {progress === null && <Loader.Item width="82px" height="82px" className="rounded-full" />}
        {progress && (
          <ProgressDonut progress={progressToday} days_left={findHowManyDaysLeft(cycleDetails.end_date) ?? 0} />
        )}
        <div className="flex flex-col h-full my-auto">
          <div className="text-xs text-custom-primary-200 font-medium self-start">Currently active cycle</div>
          <div className="inline-block line-clamp-1 truncate font-semibold text-custom-text-100 my-1 text-xl text-left">
            {cycleDetails.name}
          </div>
          <div className="flex gap-2">
            {/* Duration */}
            <div className="flex gap-1 text-xs text-custom-text-300 font-medium items-center">
              <CalendarDays className="h-3 w-3 flex-shrink-0 my-auto" />
              <span>{format(parseISO(cycleDetails.start_date), "MMM dd, yyyy")}</span>

              <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />
              <span>{format(parseISO(cycleDetails.end_date), "MMM dd, yyyy")}</span>
            </div>
            {/* created by */}
            {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />}
          </div>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <CycleListItemAction
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          cycleId={cycleId}
          cycleDetails={cycleDetails}
          parentRef={parentRef}
          isActive
        />
      </div>
    </ControlLink>
  );
};
