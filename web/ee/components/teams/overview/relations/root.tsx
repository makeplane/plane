"use client";

import React, { FC, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ERelationType } from "@plane/constants/src/teams";
import { Collapsible, CollapsibleButton, Tabs } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";
// local imports
import { TeamRelationIssueList } from "./list";
// dynamic imports
const IssuePeekOverview = dynamic(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

type Props = {
  teamId: string;
};

export const TeamRelationsRoot: FC<Props> = observer((props) => {
  const { teamId } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // refs
  const relationsContainerRef = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(true);
  // store hooks
  const { getTeamRelationsLoader, fetchTeamRelations } = useTeamAnalytics();
  // derived values
  const teamRelationsLoader = getTeamRelationsLoader(teamId);
  // fetching team relations
  useSWR(
    workspaceSlug && teamId ? ["teamRelations", workspaceSlug, teamId] : null,
    workspaceSlug && teamId ? () => fetchTeamRelations(workspaceSlug!.toString(), teamId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // handlers
  const handleToggle = () => {
    if (teamRelationsLoader === "init-loader") return;

    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      setTimeout(() => {
        if (relationsContainerRef.current) {
          requestAnimationFrame(() => {
            relationsContainerRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      }, 100);
    }
  };

  const TEAM_RELATION_TYPE_LIST = useMemo(
    () => [
      {
        key: ERelationType.BLOCKING,
        label: "Blocking",
        content: <TeamRelationIssueList teamId={teamId} type={ERelationType.BLOCKING} />,
        disabled: teamRelationsLoader === "init-loader",
      },
      {
        key: ERelationType.BLOCKED_BY,
        label: "Blocked",
        content: <TeamRelationIssueList teamId={teamId} type={ERelationType.BLOCKED_BY} />,
        disabled: teamRelationsLoader === "init-loader",
      },
    ],
    [teamId, teamRelationsLoader]
  );

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={handleToggle}
      title={
        <CollapsibleButton
          isOpen={isOpen}
          title="Relations"
          className="border-none px-0"
          titleClassName={cn(
            isOpen ? "text-custom-text-100" : "text-custom-text-300 hover:text-custom-text-200",
            teamRelationsLoader === "init-loader" && "cursor-not-allowed"
          )}
        />
      }
      className="py-2"
    >
      <>
        <div ref={relationsContainerRef} className="flex w-full h-full">
          <Tabs
            tabs={TEAM_RELATION_TYPE_LIST}
            storageKey={`teams-relations-${teamId}`}
            defaultTab="blocking"
            size="sm"
            containerClassName="pb-4"
            tabListClassName="my-2 max-w-36"
            tabPanelClassName="max-h-[184px] w-full overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-xs"
            storeInLocalStorage={false}
          />
        </div>
        <IssuePeekOverview />
      </>
    </Collapsible>
  );
});
