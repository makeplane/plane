"use client";

import React, { FC, useRef } from "react";
// types
import { ArrowRight, CalendarDays } from "lucide-react";
// icons
import { Row } from "@plane/ui";
// helpers
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { cn } from "@/helpers/common.helper";
import { useMember } from "@/hooks/store";
import { CycleListItemAction } from "../list";
import ProgressDonut from "./progress-donut";
import { dateFormatter, daysLeft } from "@/helpers/date-time.helper";
import { TCycleProgress } from "@plane/types";

type Props = {
  progress: TCycleProgress[] | null;
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: any;
};

export const CycleProgressHeader: FC<Props> = (props: Props) => {
  const { workspaceSlug, projectId, cycleId, progress, cycleDetails } = props;
  const { getUserDetails } = useMember();

  const parentRef = useRef(null);
  const createdByDetails = cycleDetails.created_by ? getUserDetails(cycleDetails.created_by) : undefined;
  const progressToday = progress && progress[progress.length - 1];

  return (
    <Row className={cn("flex items-center justify-between py-4 bg-custom-sidebar-background-100")}>
      <div className="flex gap-6 h-full">
        {progress && <ProgressDonut progress={progressToday} days_left={daysLeft(cycleDetails.end_date)} />}
        <div className="flex flex-col h-full my-auto">
          <div className="text-xs text-custom-primary-200 font-medium self-start">Currently active cycle</div>
          <div className="inline-block line-clamp-1 truncate font-semibold text-custom-text-100 my-1 text-xl">
            {cycleDetails.name}
          </div>
          <div className="flex gap-2">
            {/* Duration */}
            <div className="flex gap-1 text-xs text-custom-text-400 font-medium items-center">
              <CalendarDays className="h-3 w-3 flex-shrink-0 my-auto" />
              <span>{dateFormatter(cycleDetails.start_date)}</span>
              <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />
              <span>{dateFormatter(cycleDetails.end_date)}</span>
            </div>
            {/* created by */}
            {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />}
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <CycleListItemAction
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          cycleId={cycleId}
          cycleDetails={cycleDetails}
          parentRef={parentRef}
          isActive={true}
        />
      </div>
    </Row>
  );
};
