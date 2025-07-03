"use client";

import React, { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { TEAMSPACE_ANALYTICS_TRACKER_ELEMENTS, TEAMSPACE_ANALYTICS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Collapsible, CollapsibleButton, setToast, TOAST_TYPE, TreeMapIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { SectionEmptyState } from "@/plane-web/components/common";
import { useTeamspaces, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";
import { TStatisticsFilter } from "@/plane-web/types/teamspace";
// local imports
import { TeamspaceStatisticsMap } from "./chart";
import {
  StatisticsDataKeyFilter,
  StatisticsDependencyFilter,
  StatisticsDueByFilter,
  StatisticsLegend,
  StatisticsStateGroupFilter,
} from "./filters";

const COMMON_FILTER_LIST_CLASSNAME = "flex flex-wrap items-center gap-2.5 text-sm pb-3 px-1.5";
const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "px-2.5 py-0.5 bg-custom-background-80/60 rounded text-custom-text-100 font-medium";
const COMMON_CHEVRON_CLASSNAME = "size-3 text-custom-text-400 transition-all";

type Props = {
  teamspaceId: string;
};

export const TeamspaceStatisticsRoot: FC<Props> = observer((props) => {
  const { teamspaceId } = props;
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
  const { getTeamspaceEntitiesLoaderById, getTeamspaceEntitiesById } = useTeamspaces();
  const {
    getTeamspaceStatisticsLoader,
    getTeamspaceStatisticsFilter,
    fetchTeamspaceStatistics,
    updateTeamspaceStatisticsFilter,
  } = useTeamspaceAnalytics();
  // derived values
  const teamspaceStatisticsLoader = getTeamspaceStatisticsLoader(teamspaceId);
  const teamspaceStatisticsFilter = getTeamspaceStatisticsFilter(teamspaceId);
  const isLoading = teamspaceStatisticsLoader ? ["init-loader", "mutation"].includes(teamspaceStatisticsLoader) : true;
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const teamspaceEntities = getTeamspaceEntitiesById(teamspaceId);
  const showEmptyState =
    teamspaceEntitiesLoader !== "init-loader" &&
    teamspaceStatisticsLoader !== "init-loader" &&
    teamspaceEntities?.linked_entities.issues === 0;
  // fetching teamspace statistics
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceStatistics", workspaceSlug, teamspaceId] : null,
    workspaceSlug && teamspaceId ? () => fetchTeamspaceStatistics(workspaceSlug!.toString(), teamspaceId) : null,
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

  const handleTeamspaceStatisticsFilterChange = async <K extends keyof TStatisticsFilter>(
    key: K,
    value: TStatisticsFilter[K]
  ) => {
    captureClick({
      elementName: TEAMSPACE_ANALYTICS_TRACKER_ELEMENTS.STATISTICS_FILTER_DROPDOWN,
    });
    await updateTeamspaceStatisticsFilter(workspaceSlug!.toString(), teamspaceId, key, value)
      .then(() => {
        captureSuccess({
          eventName: TEAMSPACE_ANALYTICS_TRACKER_EVENTS.STATISTICS_FILTER_UPDATED,
          payload: {
            id: teamspaceId,
            key,
            value,
          },
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "We couldn't update teamspace statistics filter. Please try again.",
        });
        captureError({
          eventName: TEAMSPACE_ANALYTICS_TRACKER_EVENTS.STATISTICS_FILTER_UPDATED,
          payload: {
            id: teamspaceId,
            key,
            value,
          },
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
          title="Team's stats"
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
                  value={teamspaceStatisticsFilter.data_key}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamspaceStatisticsFilterChange("data_key", value)}
                />
                <StatisticsStateGroupFilter
                  value={teamspaceStatisticsFilter.state_group}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamspaceStatisticsFilterChange("state_group", value)}
                />
                <StatisticsDependencyFilter
                  value={teamspaceStatisticsFilter.dependency_type}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamspaceStatisticsFilterChange("dependency_type", value)}
                />
                <StatisticsDueByFilter
                  value={teamspaceStatisticsFilter.target_date}
                  isLoading={isLoading}
                  buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                  chevronClassName={COMMON_CHEVRON_CLASSNAME}
                  handleFilterChange={(value) => handleTeamspaceStatisticsFilterChange("target_date", value)}
                />
                {teamspaceStatisticsLoader && ["init-loader", "mutation"].includes(teamspaceStatisticsLoader) && (
                  <Spinner size={14} className="animate-spin flex-shrink-0" />
                )}
              </div>
            </div>
            <TeamspaceStatisticsMap teamspaceId={teamspaceId} />
            {teamspaceStatisticsFilter.data_key === "projects" && isSettingsEnabled && (
              <StatisticsLegend
                value={teamspaceStatisticsFilter.legend}
                isLoading={isLoading}
                buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
                chevronClassName={COMMON_CHEVRON_CLASSNAME}
                handleFilterChange={(value) => handleTeamspaceStatisticsFilterChange("legend", value)}
              />
            )}
          </>
        ) : (
          <SectionEmptyState
            heading={t("teamspace_analytics.empty_state.stats.general.title")}
            subHeading={t("teamspace_analytics.empty_state.stats.general.description")}
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
