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
import { Loader as Spinner } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TreeMapIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleButton } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";
// plane web imports
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";
import { useTeamspaces, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";
import type { TStatisticsFilter } from "@/types/teamspace";
// local imports
import { TeamspaceStatisticsMap } from "./chart";
import { StatisticsDataKeyFilter } from "./filters/data-key";
import { StatisticsDependencyFilter } from "./filters/dependency";
import { StatisticsDueByFilter } from "./filters/due-by";
import { StatisticsLegend } from "./filters/legend";
import { StatisticsStateGroupFilter } from "./filters/state-group";

const COMMON_FILTER_LIST_CLASSNAME = "flex flex-wrap items-center gap-2.5 text-body-xs-regular pb-3 px-1.5";
const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "px-2.5 py-0.5 bg-layer-2 hover:bg-layer-2-hover active:bg-layer-2-active disabled:bg-layer-transparent text-secondary disabled:text-disabled border border-strong disabled:border-subtle-1 shadow-raised-100 rounded-md font-medium transition-colors";
const COMMON_CHEVRON_CLASSNAME = "size-3 text-placeholder transition-all";

type Props = {
  teamspaceId: string;
};

export const TeamspaceStatisticsRoot = observer(function TeamspaceStatisticsRoot(props: Props) {
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
    workspaceSlug && teamspaceId ? () => fetchTeamspaceStatistics(workspaceSlug.toString(), teamspaceId) : null,
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
    await updateTeamspaceStatisticsFilter(workspaceSlug.toString(), teamspaceId, key, value).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "We couldn't update teamspace statistics filter. Please try again.",
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
          title="Team's stats"
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-primary" : "text-tertiary hover:text-secondary")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
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
              icon={<TreeMapIcon className="size-6 text-placeholder" />}
              variant="solid"
              iconVariant="round"
              size="md"
              contentClassName="gap-1"
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
