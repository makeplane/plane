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

import React, { useRef } from "react";
import { format, startOfToday } from "date-fns";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { CycleGroupIcon, InfoIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { ICycle, TCycleProgress } from "@plane/types";
import { ControlLink, Loader } from "@plane/ui";
import { generateQueryParams } from "@plane/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MergedDateDisplay } from "@/components/dropdowns/merged-date";
import { CycleQuickActions } from "@/components/cycles/quick-actions";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parentRef = useRef(null);
  const progressToday = progress && progress.find((d) => d.date === format(startOfToday(), "yyyy-MM-dd"));
  // store hooks
  const { getUserDetails } = useMember();
  const createdByDetails = cycleDetails.created_by ? getUserDetails(cycleDetails.created_by) : undefined;
  // handlers
  const openCycleOverview = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const query = generateQueryParams(searchParams, ["peekCycle"]);
    if (searchParams.has("peekCycle") && searchParams.get("peekCycle") === cycleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekCycle=${cycleId}`);
    }
  };

  const handleEventPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <ControlLink
      href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}
      onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`)}
    >
      <div ref={parentRef} className="group px-page-x flex items-center justify-between py-4 bg-surface-1 w-full">
        <div className="flex gap-4 h-full truncate items-center">
          {progress === null && <Loader.Item width="48px" height="48px" className="shrink-0 rounded-full" />}
          {progress && <ProgressDonut progress={progressToday} />}
          <div className="flex flex-col overflow-hidden">
            <Tooltip tooltipContent={cycleDetails.name} position="bottom-end">
              <span className="truncate font-bold text-primary text-xl">{cycleDetails.name}</span>
            </Tooltip>
          </div>
        </div>
        <div className="flex shrink-0 gap-3 items-center" onClick={handleEventPropagation}>
          <button onClick={openCycleOverview} className="shrink-0 hidden group-hover:flex">
            <InfoIcon className="h-4 w-4 text-placeholder" />
          </button>
          {cycleDetails.start_date && cycleDetails.end_date && (
            <Button variant="secondary" size="sm" prependIcon={<CalendarDays className="size-3" />} disabled>
              <MergedDateDisplay startDate={cycleDetails.start_date} endDate={cycleDetails.end_date} />
            </Button>
          )}
          {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails.id} />}
          <CycleQuickActions
            parentRef={parentRef}
            cycleId={cycleId}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </div>
    </ControlLink>
  );
}
