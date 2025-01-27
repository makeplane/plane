"use client";

import React, { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Collapsible, CollapsibleButton, setToast, TOAST_TYPE, TreeMapIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { SectionEmptyState } from "@/plane-web/components/common";
import { useTeams, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
import { TStatisticsFilter } from "@/plane-web/types/teams";
// local imports
import { TeamStatisticsMap } from "./chart";
import {
  StatisticsDataKeyFilter,
  StatisticsDependencyFilter,
  StatisticsDueByFilter,
  StatisticsLegend,
  StatisticsScope,
  StatisticsStateGroupFilter,
} from "./filters";

const COMMON_FILTER_LIST_CLASSNAME = "flex flex-wrap items-center gap-2.5 text-sm pb-3 px-1.5";
const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "px-2.5 py-0.5 bg-custom-background-80/60 rounded text-custom-text-100 font-medium";
const COMMON_CHEVRON_CLASSNAME = "size-3 text-custom-text-400 transition-all";

type Props = {
  teamId: string;
};

export const TeamStatisticsRoot: FC<Props> = observer((props) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const statisticsContainerRef = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(true);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { isSettingsEnabled } = useWorkspaceProjectStates();
  const { getTeamEntitiesLoaderById, getTeamEntitiesById } = useTeams();
  const { getTeamStatisticsLoader, getTeamStatisticsFilter, fetchTeamStatistics, updateTeamStatisticsFilter } =
    useTeamAnalytics();
  // derived values
  const teamStatisticsLoader = getTeamStatisticsLoader(teamId);
  const teamStatisticsFilter = getTeamStatisticsFilter(teamId);
  const isLoading = teamStatisticsLoader ? ["init-loader", "mutation"].includes(teamStatisticsLoader) : true;
  const teamEntitiesLoader = getTeamEntitiesLoaderById(teamId);
  const teamEntities = getTeamEntitiesById(teamId);
  const showEmptyState =
    teamEntitiesLoader !== "init-loader" &&
    teamStatisticsLoader !== "init-loader" &&
    teamEntities?.linked_entities.issues === 0;
  // fetching team statistics
  useSWR(
    workspaceSlug && teamId ? ["teamStatistics", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamStatistics(workspaceSlug!.toString(), teamId) : null,
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
        if (statisticsContainerRef.current) {
          requestAnimationFrame(() => {
            statisticsContainerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      }, 100);
    }
  };

  const handleTeamStatisticsFilterChange = async <K extends keyof TStatisticsFilter>(
    key: K,
    value: TStatisticsFilter[K]
  ) => {
    await updateTeamStatisticsFilter(workspaceSlug!.toString(), teamId, key, value).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "We couldn't update team statistics filter. Please try again.",
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
          title="Team stats"
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200")}
        />
      }
      className="py-2"
    >
      <div ref={statisticsContainerRef}>
        {!showEmptyState ? (
          <>
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className={COMMON_FILTER_LIST_CLASSNAME}>
                <StatisticsDataKeyFilter
                  value={teamStatisticsFilter.data_key}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamStatisticsFilterChange("data_key", value)}
                />
                <StatisticsStateGroupFilter
                  value={teamStatisticsFilter.state_group}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamStatisticsFilterChange("state_group", value)}
                />
                <StatisticsDependencyFilter
                  value={teamStatisticsFilter.dependency_type}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamStatisticsFilterChange("dependency_type", value)}
                />
                <StatisticsDueByFilter
                  value={teamStatisticsFilter.target_date}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamStatisticsFilterChange("target_date", value)}
                />
                {teamStatisticsLoader && ["init-loader", "mutation"].includes(teamStatisticsLoader) && (
                  <Spinner size={14} className="animate-spin flex-shrink-0" />
                )}
              </div>
              <div className={COMMON_FILTER_LIST_CLASSNAME}>
                <StatisticsScope
                  value={teamStatisticsFilter.scope}
                  isLoading={isLoading}
                  handleFilterChange={(value) => handleTeamStatisticsFilterChange("scope", value)}
                />
              </div>
            </div>
            <TeamStatisticsMap teamId={teamId} />
            {teamStatisticsFilter.data_key === "projects" && isSettingsEnabled && (
              <StatisticsLegend
                value={teamStatisticsFilter.legend}
                isLoading={isLoading}
                buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                chevronClassName={COMMON_CHEVRON_CLASSNAME}
                handleFilterChange={(value) => handleTeamStatisticsFilterChange("legend", value)}
              />
            )}
          </>
        ) : (
          <SectionEmptyState
            heading={t("team-stats-empty-state-title")}
            subHeading={t("team-stats-empty-state-description")}
            icon={<TreeMapIcon className="size-6 text-custom-text-400" />}
            variant="solid"
            iconVariant="round"
            size="md"
            contentClassName="gap-1"
          />
        )}
      </div>
    </Collapsible>
  );
});
