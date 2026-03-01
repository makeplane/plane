/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import React, { useRef } from "react";
import { format, startOfToday } from "date-fns";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { ICycle, TCycleProgress } from "@plane/types";
import { ControlLink, Loader } from "@plane/ui";
import { findHowManyDaysLeft } from "@plane/utils";
import { CycleListItemAction } from "@/components/cycles/list/cycle-list-item-action";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { BetaBadge } from "@/components/common/beta";
import ProgressDonut from "./progress-donut";

type Props = {
  progress: Partial<TCycleProgress>[] | null;
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: ICycle;
};

export function CycleProgressHeader(props: Props) {
  const { workspaceSlug, projectId, cycleId, progress, cycleDetails } = props;

  // router
  const router = useAppRouter();
  const parentRef = useRef(null);
  const progressToday = progress && progress.find((d) => d.date === format(startOfToday(), "yyyy-MM-dd"));
  // handlers
  const handleControlLinkClick = () => {
    router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`);
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
      <div className="px-page-x flex items-center justify-between py-4 bg-surface-1 w-full">
        <div className="flex gap-6 h-full truncate">
          {progress === null && <Loader.Item width="65px" height="65px" className="flex-shrink-0 rounded-full" />}
          {progress && (
            <ProgressDonut progress={progressToday} days_left={findHowManyDaysLeft(cycleDetails.end_date) ?? 0} />
          )}
          <div className="flex flex-col h-full my-auto w-full overflow-hidden">
            <div className="flex gap-2 items-center">
              <div className="text-11 text-accent-secondary font-medium">Currently active cycle</div>
              <BetaBadge />
            </div>
            <Tooltip tooltipContent={cycleDetails.name} position="bottom-end">
              <div className="inline-block line-clamp-1 truncate font-bold text-primary my-1 text-[20px] text-left">
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
}
