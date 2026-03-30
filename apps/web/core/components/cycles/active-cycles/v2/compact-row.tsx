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

import React, { useMemo, useRef } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import { CalendarDays, ChevronRight } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CycleGroupIcon, InfoIcon } from "@plane/propel/icons";
import { CircularProgressIndicator } from "@plane/ui";
import { calculateCycleProgress, getClosedIssuesLabel, renderFormattedPayloadDate } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useMember } from "@/hooks/store/use-member";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useQueryParams } from "@/hooks/use-query-params";
// components
import { ListItem } from "@/components/core/list";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MergedDateDisplay } from "@/components/dropdowns/merged-date";
import { CycleQuickActions } from "../../quick-actions";
// local imports
import ScopeDelta from "./scope-delta";
import { useActiveCycleDetails } from "./use-active-cycle-details";
import { summaryDataFormatter } from "./helper";

type Props = {
  cycleId: string;
  workspaceSlug: string;
  projectId: string;
  onToggle: () => void;
};

export const ActiveCycleCompactRow = observer(function ActiveCycleCompactRow(props: Props) {
  const { cycleId, workspaceSlug, projectId, onToggle } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // router
  const router = useAppRouter();
  const [searchParams] = useSearchParams();
  const { updateQueryParams } = useQueryParams();
  // store hooks
  const { getCycleById } = useCycle();
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // derived values
  const cycleDetails = getCycleById(cycleId);
  const createdByDetails = cycleDetails?.created_by ? getUserDetails(cycleDetails.created_by) : undefined;
  const cycleProgress = useActiveCycleDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });

  const progress = cycleDetails ? calculateCycleProgress(cycleDetails) : 0;
  const today = renderFormattedPayloadDate(new Date()) ?? "";
  const progressData = cycleProgress.cycleProgress;
  const dataToday = progressData?.find((d) => d.date === today);
  const estimateTypeFormatter = summaryDataFormatter("issues");

  // Compute scope delta visibility
  const hasScopeDelta = useMemo(() => {
    if (!progressData || !dataToday) return false;
    const prevIndex = progressData.findIndex((d) => d.date === dataToday.date) - 1;
    if (prevIndex < 0) return false;
    const prevData = progressData[prevIndex];
    return prevData.scope !== dataToday.scope && !!prevData.scope;
  }, [progressData, dataToday]);

  if (!cycleDetails) return null;

  // Compute trailing/leading value
  const trailingValue =
    dataToday && dataToday.ideal !== undefined && dataToday.actual !== undefined
      ? Math.abs(dataToday.ideal - dataToday.actual)
      : null;
  const isBehind = dataToday ? (dataToday.ideal ?? 0) < (dataToday.actual ?? 0) : false;

  const openCycleOverview = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const isPeeking = searchParams.get("peekCycle") === cycleId;
    const newRoute = isPeeking
      ? updateQueryParams({ paramsToRemove: ["peekCycle"] })
      : updateQueryParams({ paramsToAdd: { peekCycle: cycleId } });
    router.push(newRoute);
  };

  const handleEventPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <ListItem
      title={cycleDetails.name}
      itemLink={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`}
      parentRef={parentRef}
      isMobile={isMobile}
      className="py-3 text-13 border-b border-subtle bg-layer-transparent hover:bg-layer-transparent-hover"
      prependTitleElement={
        <>
          <IconButton
            icon={ChevronRight}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggle();
            }}
            aria-label="Toggle cycle details"
          />
          <CycleGroupIcon cycleGroup="current" height="16" width="16" />
        </>
      }
      appendTitleElement={
        <button onClick={openCycleOverview} className={`z-5 shrink-0 ${isMobile ? "flex" : "hidden group-hover:flex"}`}>
          <InfoIcon className="h-4 w-4 text-placeholder" />
        </button>
      }
      actionableItems={
        <div className="flex items-center gap-3 shrink-0" onClick={handleEventPropagation}>
          {/* Progress fraction */}
          <div className="flex items-center gap-1.5">
            <CircularProgressIndicator size={16} percentage={progress} strokeWidth={2} />
            <span className="text-11 text-tertiary font-medium">
              {progress}% (
              {getClosedIssuesLabel(
                cycleDetails.completed_issues,
                cycleDetails.total_issues,
                cycleDetails.cancelled_issues
              )}
              )
            </span>
          </div>

          {/* Scope delta */}
          {hasScopeDelta && (
            <>
              <div className="h-3 w-px bg-subtle" />
              <div className="flex items-center gap-1 text-11">
                <span className="text-tertiary">Scope</span>
                <ScopeDelta data={progressData} dataToday={dataToday} />
              </div>
            </>
          )}

          {/* Trailing/Leading */}
          {trailingValue !== null && trailingValue > 0 && (
            <>
              <div className="h-3 w-px bg-subtle" />
              <div className="flex items-center gap-1 text-11">
                <span className={isBehind ? "text-danger-primary" : "text-success-primary"}>
                  {isBehind ? t("project_cycles.active_cycle.trailing") : t("project_cycles.active_cycle.leading")}
                </span>
                <span className={`font-medium ${isBehind ? "text-danger-primary" : "text-success-primary"}`}>
                  {estimateTypeFormatter(trailingValue)}
                </span>
              </div>
            </>
          )}

          {/* Date button */}
          {cycleDetails.start_date && cycleDetails.end_date && (
            <Button variant="secondary" size="sm" prependIcon={<CalendarDays className="size-3" />} disabled>
              <MergedDateDisplay startDate={cycleDetails.start_date} endDate={cycleDetails.end_date} />
            </Button>
          )}

          {/* Lead avatar */}
          {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails.id} />}

          {/* Quick actions menu */}
          <div className="hidden md:block">
            <CycleQuickActions
              parentRef={parentRef}
              cycleId={cycleId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </div>
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
    />
  );
});
