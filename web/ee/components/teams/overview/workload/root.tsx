"use client";

import React, { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { Collapsible, CollapsibleButton, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
import { TWorkloadFilter } from "@/plane-web/types/teams";
// local imports
import { TeamWorkloadBanner } from "./banner";
import { TeamWorkloadChart } from "./chart";
import { TeamWorkloadSummary } from "./summary";

type Props = {
  teamId: string;
};

export const TeamWorkloadRoot: FC<Props> = observer((props) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const workloadContainerRef = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(true);
  // store hooks
  const {
    getTeamWorkloadFilter,
    getTeamWorkloadChart,
    fetchTeamWorkloadChartDetails,
    fetchTeamWorkloadSummary,
    updateTeamWorkloadFilter,
  } = useTeamAnalytics();
  // derived values
  const filter = getTeamWorkloadFilter(teamId);
  const teamWorkload = getTeamWorkloadChart(teamId);
  // fetching team workload
  useSWR(
    workspaceSlug && teamId ? ["teamWorkloadChart", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamWorkloadChartDetails(workspaceSlug!.toString(), teamId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  useSWR(
    workspaceSlug && teamId ? ["teamWorkloadSummary", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamWorkloadSummary(workspaceSlug!.toString(), teamId) : null,
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
        if (workloadContainerRef.current) {
          requestAnimationFrame(() => {
            workloadContainerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      }, 100);
    }
  };

  const handleTeamWorkloadFilterChange = async (payload: Partial<TWorkloadFilter>) => {
    await updateTeamWorkloadFilter(workspaceSlug!.toString(), teamId, payload).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "We couldn't update team workload filter. Please try again.",
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
          title="Team's workload"
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200")}
        />
      }
      className="py-2"
    >
      <div ref={workloadContainerRef} className="flex flex-col gap-2">
        <TeamWorkloadBanner teamId={teamId} />
        <div className="w-full h-full grid grid-cols-5 gap-3 py-2">
          <div className="w-full h-full col-span-5 lg:col-span-3">
            {filter.xAxisKey && filter.yAxisKey && (
              <TeamWorkloadChart
                teamId={teamId}
                data={teamWorkload?.distribution || []}
                xAxisKey={filter.xAxisKey}
                yAxisKey={filter.yAxisKey}
                handleXAxisKeyChange={(key) => handleTeamWorkloadFilterChange({ xAxisKey: key })}
              />
            )}
          </div>
          <div className="w-full h-full col-span-5 lg:col-span-2">
            <TeamWorkloadSummary teamId={teamId} />
          </div>
        </div>
      </div>
    </Collapsible>
  );
});
