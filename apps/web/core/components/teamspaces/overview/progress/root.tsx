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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { BarIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleButton } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";
// plane web imports
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";
import type { TWorkloadFilter } from "@/types/teamspace";
// local imports
import { TeamspaceProgressBanner } from "./banner";
import { TeamspaceProgressChart } from "./chart";
import { TeamspaceProgressSummary } from "./summary";

type Props = {
  teamspaceId: string;
};

export const TeamspaceProgressRoot = observer(function TeamspaceProgressRoot(props: Props) {
  const { teamspaceId } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const progressContainerRef = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(true);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamspaceEntitiesLoaderById, getTeamspaceEntitiesById } = useTeamspaces();
  const {
    getTeamspaceProgressChartLoader,
    getTeamspaceProgressSummaryLoader,
    getTeamspaceProgressFilter,
    getTeamspaceProgressChart,
    fetchTeamspaceProgressChartDetails,
    fetchTeamspaceProgressSummary,
    updateTeamspaceProgressFilter,
  } = useTeamspaceAnalytics();
  // derived values
  const filter = getTeamspaceProgressFilter(teamspaceId);
  const teamspaceEntities = getTeamspaceEntitiesById(teamspaceId);
  const teamspaceProgress = getTeamspaceProgressChart(teamspaceId);
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const teamspaceProgressChartLoader = getTeamspaceProgressChartLoader(teamspaceId);
  const teamspaceProgressSummaryLoader = getTeamspaceProgressSummaryLoader(teamspaceId);
  const isLoading =
    teamspaceEntitiesLoader === "init-loader" ||
    teamspaceProgressChartLoader === "init-loader" ||
    teamspaceProgressSummaryLoader === "init-loader";
  const showEmptyState = !isLoading && teamspaceEntities?.linked_entities.issues === 0;
  // fetching teamspace progress
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceProgressChart", workspaceSlug, teamspaceId] : null,
    workspaceSlug && teamspaceId
      ? () => fetchTeamspaceProgressChartDetails(workspaceSlug.toString(), teamspaceId)
      : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceProgressSummary", workspaceSlug, teamspaceId] : null,
    workspaceSlug && teamspaceId ? () => fetchTeamspaceProgressSummary(workspaceSlug.toString(), teamspaceId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // handlers
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      setTimeout(() => {
        if (progressContainerRef.current) {
          requestAnimationFrame(() => {
            progressContainerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      }, 100);
    }
  };

  const handleTeamspaceProgressFilterChange = async (payload: Partial<TWorkloadFilter>) => {
    await updateTeamspaceProgressFilter(workspaceSlug.toString(), teamspaceId, payload).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "We couldn't update teamspace progress filter. Please try again.",
      });
    });
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => {
        if (open !== isOpen) {
          handleToggle();
        }
      }}
      className="py-2"
    >
      <CollapsibleTrigger>
        <CollapsibleButton
          isOpen={isOpen}
          title="Team's progress"
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-primary" : "text-tertiary hover:text-secondary")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div ref={progressContainerRef} className="flex flex-col gap-2">
          {!showEmptyState ? (
            <>
              <TeamspaceProgressBanner teamspaceId={teamspaceId} />
              <div className="w-full h-full grid grid-cols-5 gap-3 py-2">
                <div className="w-full h-full col-span-5 lg:col-span-3">
                  {filter.xAxisKey && filter.yAxisKey && (
                    <TeamspaceProgressChart
                      teamspaceId={teamspaceId}
                      data={teamspaceProgress?.distribution || []}
                      xAxisKey={filter.xAxisKey}
                      yAxisKey={filter.yAxisKey}
                      handleXAxisKeyChange={(key) => handleTeamspaceProgressFilterChange({ xAxisKey: key })}
                    />
                  )}
                </div>
                <div className="w-full h-full col-span-5 lg:col-span-2">
                  <TeamspaceProgressSummary teamspaceId={teamspaceId} />
                </div>
              </div>
            </>
          ) : (
            <SectionEmptyState
              heading={t("teamspace_analytics.empty_state.progress.title")}
              subHeading={t("teamspace_analytics.empty_state.progress.description")}
              icon={<BarIcon className="size-6 text-placeholder" />}
              variant="solid"
              iconVariant="round"
              size="md"
              containerClassName="mb-4"
              contentClassName="gap-1"
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
