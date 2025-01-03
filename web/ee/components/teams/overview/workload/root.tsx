"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { TWorkloadFilter } from "@plane/types";
import { Collapsible, CollapsibleButton, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
// local imports
import { TeamWorkloadChart } from "./chart";
// import { TeamWorkloadDetail } from "./detail";

type Props = {
  teamId: string;
};

export const TeamWorkloadRoot: FC<Props> = observer((props) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isOpen, setIsOpen] = useState(false);
  // store hooks
  const { getTeamWorkloadFilter, getTeamWorkload, fetchTeamWorkload, updateTeamWorkloadFilter } = useTeamAnalytics();
  // derived values
  const filter = getTeamWorkloadFilter(teamId);
  const teamWorkload = getTeamWorkload(teamId);
  // fetching team workload
  useSWR(
    workspaceSlug && teamId ? ["teamWorkload", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamWorkload(workspaceSlug!.toString(), teamId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // handlers
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
      onToggle={() => setIsOpen((prevState) => !prevState)}
      title={
        <CollapsibleButton
          isOpen={isOpen}
          title="Team's workload"
          className="border-none px-0"
          titleClassName={cn(isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200")}
        />
      }
      buttonClassName="w-full"
      className="py-2"
    >
      <div className="w-full h-full grid grid-cols-5 gap-3 py-2">
        {/* <div className="w-full h-full col-span-5 lg:col-span-3"> */}
        <div className="w-full h-full col-span-5">
          {filter.xAxisKey && filter.yAxisKey && (
            <TeamWorkloadChart
              teamId={teamId}
              data={teamWorkload?.distribution || []}
              xAxisKey={filter.xAxisKey}
              yAxisKey={filter.yAxisKey}
              handleXAxisKeyChange={(key) => handleTeamWorkloadFilterChange({ xAxisKey: key })}
              handleYAxisKeyChange={(key) => handleTeamWorkloadFilterChange({ yAxisKey: key })}
            />
          )}
        </div>
        {/* <div className="w-full h-full col-span-5 lg:col-span-2">
          <TeamWorkloadDetail teamId={teamId} />
        </div> */}
      </div>
    </Collapsible>
  );
});
