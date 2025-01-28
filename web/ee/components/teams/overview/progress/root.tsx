"use client";

import React, { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { BarIcon, Collapsible, CollapsibleButton, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { SectionEmptyState } from "@/plane-web/components/common";
import { useTeams } from "@/plane-web/hooks/store";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
import { TWorkloadFilter } from "@/plane-web/types/teams";
// local imports
import { TeamProgressBanner } from "./banner";
import { TeamProgressChart } from "./chart";
import { TeamProgressSummary } from "./summary";

type Props = {
  teamId: string;
};

export const TeamProgressRoot: FC<Props> = observer((props) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const progressContainerRef = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(true);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamEntitiesLoaderById, getTeamEntitiesById } = useTeams();
  const {
    getTeamProgressChartLoader,
    getTeamProgressSummaryLoader,
    getTeamProgressFilter,
    getTeamProgressChart,
    fetchTeamProgressChartDetails,
    fetchTeamProgressSummary,
    updateTeamProgressFilter,
  } = useTeamAnalytics();
  // derived values
  const filter = getTeamProgressFilter(teamId);
  const teamEntities = getTeamEntitiesById(teamId);
  const teamProgress = getTeamProgressChart(teamId);
  const teamEntitiesLoader = getTeamEntitiesLoaderById(teamId);
  const teamProgressChartLoader = getTeamProgressChartLoader(teamId);
  const teamProgressSummaryLoader = getTeamProgressSummaryLoader(teamId);
  const isLoading =
    teamEntitiesLoader === "init-loader" ||
    teamProgressChartLoader === "init-loader" ||
    teamProgressSummaryLoader === "init-loader";
  const showEmptyState = !isLoading && teamEntities?.linked_entities.issues === 0;
  // fetching team progress
  useSWR(
    workspaceSlug && teamId ? ["teamProgressChart", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamProgressChartDetails(workspaceSlug!.toString(), teamId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  useSWR(
    workspaceSlug && teamId ? ["teamProgressSummary", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamProgressSummary(workspaceSlug!.toString(), teamId) : null,
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

  const handleTeamProgressFilterChange = async (payload: Partial<TWorkloadFilter>) => {
    await updateTeamProgressFilter(workspaceSlug!.toString(), teamId, payload).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "We couldn't update team progress filter. Please try again.",
      });
    });
  };

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={handleToggle}
      title={
        <CollapsibleButton
          isOpen={isOpen}
          title="Team progress"
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200")}
        />
      }
      className="py-2"
    >
      <div ref={progressContainerRef} className="flex flex-col gap-2">
        {!showEmptyState ? (
          <>
            <TeamProgressBanner teamId={teamId} />
            <div className="w-full h-full grid grid-cols-5 gap-3 py-2">
              <div className="w-full h-full col-span-5 lg:col-span-3">
                {filter.xAxisKey && filter.yAxisKey && (
                  <TeamProgressChart
                    teamId={teamId}
                    data={teamProgress?.distribution || []}
                    xAxisKey={filter.xAxisKey}
                    yAxisKey={filter.yAxisKey}
                    handleXAxisKeyChange={(key) => handleTeamProgressFilterChange({ xAxisKey: key })}
                  />
                )}
              </div>
              <div className="w-full h-full col-span-5 lg:col-span-2">
                <TeamProgressSummary teamId={teamId} />
              </div>
            </div>
          </>
        ) : (
          <SectionEmptyState
            heading={t("team-progress-empty-state-title")}
            subHeading={t("team-progress-empty-state-description")}
            icon={<BarIcon className="size-6 text-custom-text-400" />}
            variant="solid"
            iconVariant="round"
            size="md"
            containerClassName="mb-4"
            contentClassName="gap-1"
          />
        )}
      </div>
    </Collapsible>
  );
});
