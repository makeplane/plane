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
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
// plane imports
import { CycleGroupIcon, InfoIcon } from "@plane/propel/icons";
import type { TCycleGroups } from "@plane/types";
import { generateQueryParams } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { ListItem } from "@/components/core/list";
import { MergedDateDisplay } from "@/components/dropdowns/merged-date";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useMember } from "@/hooks/store/use-member";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { CycleQuickActions } from "../quick-actions";
import { StartCycleButton } from "../start-cycle/button";
import { Button } from "@plane/propel/button";
import { CalendarDays } from "lucide-react";

type TCyclesListItem = {
  cycleId: string;
  workspaceSlug: string;
  projectId: string;
  className?: string;
};

export const CyclesListItem = observer(function CyclesListItem(props: TCyclesListItem) {
  const { cycleId, workspaceSlug, projectId, className } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // store hooks
  const { getCycleById } = useCycle();
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();

  // derived values
  const cycleDetails = getCycleById(cycleId);

  if (!cycleDetails) return null;

  // computed
  const cycleStatus = cycleDetails.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const createdByDetails = cycleDetails.created_by ? getUserDetails(cycleDetails.created_by) : undefined;

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

  const handleArchivedCycleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    openCycleOverview(e);
  };

  const handleItemClick = cycleDetails.archived_at ? handleArchivedCycleClick : undefined;
  return (
    <ListItem
      title={cycleDetails.name}
      itemLink={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`}
      onItemClick={handleItemClick}
      prependTitleElement={<CycleGroupIcon cycleGroup={cycleStatus} height="16" width="16" />}
      appendTitleElement={
        <>
          <button
            onClick={openCycleOverview}
            className={`z-5 shrink-0 ${isMobile ? "flex" : "hidden group-hover:flex"}`}
          >
            <InfoIcon className="h-4 w-4 text-placeholder" />
          </button>
        </>
      }
      actionableItems={
        <>
          <StartCycleButton cycleId={cycleId} projectId={projectId} />

          {cycleDetails.start_date && cycleDetails.end_date && (
            <Button variant="secondary" size="sm" prependIcon={<CalendarDays className="size-3" />} disabled>
              <MergedDateDisplay startDate={cycleDetails.start_date} endDate={cycleDetails.end_date} />
            </Button>
          )}
          {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails.id} />}
          <div className="hidden md:block">
            <CycleQuickActions
              parentRef={parentRef}
              cycleId={cycleId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </>
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
      className={className}
    />
  );
});
