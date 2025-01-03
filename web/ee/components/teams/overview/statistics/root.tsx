"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { TStatisticsFilter } from "@plane/types";
import { Collapsible, CollapsibleButton, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
// local imports
import { TeamStatisticsMap } from "./chart";
import { StatisticsDataKeyFilter, StatisticsLegend, StatisticsValueKeyFilter } from "./filters";

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
  // states
  const [isOpen, setIsOpen] = useState(false);
  // stor hooks
  const { isSettingsEnabled } = useWorkspaceProjectStates();
  const { getTeamStatisticsLoader, getTeamStatisticsFilter, fetchTeamStatistics, updateTeamStatisticsFilter } =
    useTeamAnalytics();
  // derived values
  const teamStatisticsLoader = getTeamStatisticsLoader(teamId);
  const teamStatisticsFilter = getTeamStatisticsFilter(teamId);
  const isLoading = teamStatisticsLoader ? ["init-loader", "mutation"].includes(teamStatisticsLoader) : true;
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
      onToggle={() => setIsOpen((prevState) => !prevState)}
      title={
        <CollapsibleButton
          isOpen={isOpen}
          title="Statistics"
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200")}
        />
      }
      buttonClassName="w-full"
      className="py-2"
    >
      <div className="flex items-center gap-2.5 text-sm pb-3 px-1.5">
        <StatisticsDataKeyFilter
          value={teamStatisticsFilter.dataKey}
          isLoading={isLoading}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          chevronClassName={COMMON_CHEVRON_CLASSNAME}
          handleFilterChange={(value) => handleTeamStatisticsFilterChange("dataKey", value)}
        />
        <StatisticsValueKeyFilter
          value={teamStatisticsFilter.valueKey}
          isLoading={isLoading}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          chevronClassName={COMMON_CHEVRON_CLASSNAME}
          handleFilterChange={(value) => handleTeamStatisticsFilterChange("valueKey", value)}
        />
        {teamStatisticsLoader && ["init-loader", "mutation"].includes(teamStatisticsLoader) && (
          <Spinner size={14} className="animate-spin flex-shrink-0" />
        )}
      </div>
      <TeamStatisticsMap teamId={teamId} />
      {teamStatisticsFilter.dataKey === "projects" && isSettingsEnabled && (
        <StatisticsLegend
          value={teamStatisticsFilter.legend}
          isLoading={isLoading}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          chevronClassName={COMMON_CHEVRON_CLASSNAME}
          handleFilterChange={(value) => handleTeamStatisticsFilterChange("legend", value)}
        />
      )}
    </Collapsible>
  );
});
