"use client";

import React, { FC, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EDependencyType } from "@plane/constants/src/teams";
import { Collapsible, CollapsibleButton, Tabs } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
// local imports
import { TeamDependencyIssueList } from "./list";
// dynamic imports
const IssuePeekOverview = dynamic(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

type Props = {
  teamId: string;
};

export const TeamDependenciesRoot: FC<Props> = observer((props) => {
  const { teamId } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // refs
  const dependenciesContainerRef = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(true);
  // store hooks
  const { getTeamDependenciesLoader, getTeamDependencies, fetchTeamDependencies } = useTeamAnalytics();
  // derived values
  const teamDependenciesLoader = getTeamDependenciesLoader(teamId);
  const teamDependencies = getTeamDependencies(teamId);
  // fetching team dependencies
  useSWR(
    workspaceSlug && teamId ? ["teamDependencies", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamDependencies(workspaceSlug!.toString(), teamId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // handlers
  const handleToggle = () => {
    if (teamDependenciesLoader === "init-loader") return;

    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      setTimeout(() => {
        if (dependenciesContainerRef.current) {
          requestAnimationFrame(() => {
            dependenciesContainerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      }, 100);
    }
  };

  const TEAM_DEPENDENCY_TYPE_LIST = useMemo(
    () => [
      {
        key: EDependencyType.BLOCKING,
        label: "Blocking",
        content: <TeamDependencyIssueList teamId={teamId} type={EDependencyType.BLOCKING} />,
        disabled: teamDependenciesLoader === "init-loader" || (teamDependencies?.blocking_issues.length ?? 0) === 0,
      },
      {
        key: EDependencyType.BLOCKED_BY,
        label: "Blocked",
        content: <TeamDependencyIssueList teamId={teamId} type={EDependencyType.BLOCKED_BY} />,
        disabled: teamDependenciesLoader === "init-loader" || (teamDependencies?.blocked_by_issues.length ?? 0) === 0,
      },
    ],
    [
      teamId,
      teamDependenciesLoader,
      teamDependencies?.blocking_issues.length,
      teamDependencies?.blocked_by_issues.length,
    ]
  );

  if (
    teamDependenciesLoader !== "init-loader" &&
    teamDependencies?.blocked_by_issues.length === 0 &&
    teamDependencies?.blocking_issues.length === 0
  ) {
    return null;
  }
  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={handleToggle}
      title={
        <CollapsibleButton
          isOpen={isOpen}
          title="Dependencies"
          className="border-none px-0"
          titleClassName={cn(
            isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200",
            teamDependenciesLoader === "init-loader" && "cursor-not-allowed"
          )}
        />
      }
      className="py-2"
    >
      <>
        <div ref={dependenciesContainerRef} className="flex w-full h-full">
          <Tabs
            tabs={TEAM_DEPENDENCY_TYPE_LIST}
            storageKey={`teams-dependencies-${teamId}`}
            defaultTab="blocking"
            size="sm"
            containerClassName="pb-4"
            tabListClassName="my-2 max-w-36"
            tabPanelClassName="max-h-[180px] w-full overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-xs"
            storeInLocalStorage={false}
          />
        </div>
        <IssuePeekOverview />
      </>
    </Collapsible>
  );
});
