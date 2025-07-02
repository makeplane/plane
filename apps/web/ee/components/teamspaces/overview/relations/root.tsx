"use client";

import React, { FC, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ERelationType } from "@plane/constants";
import { Collapsible, CollapsibleButton, Tabs } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";
// local imports
import { TeamspaceRelationIssueList } from "./list";
// dynamic imports
const IssuePeekOverview = dynamic(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

type Props = {
  teamspaceId: string;
};

export const TeamspaceRelationsRoot: FC<Props> = observer((props) => {
  const { teamspaceId } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // refs
  const relationsContainerRef = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(true);
  // store hooks
  const { getTeamspaceRelationsLoader, fetchTeamspaceRelations } = useTeamspaceAnalytics();
  // derived values
  const teamspaceRelationsLoader = getTeamspaceRelationsLoader(teamspaceId);
  // fetching teamspace relations
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceRelations", workspaceSlug, teamspaceId] : null,
    workspaceSlug && teamspaceId ? () => fetchTeamspaceRelations(workspaceSlug!.toString(), teamspaceId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // handlers
  const handleToggle = () => {
    if (teamspaceRelationsLoader === "init-loader") return;

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
        content: <TeamspaceRelationIssueList teamspaceId={teamspaceId} type={ERelationType.BLOCKING} />,
        disabled: teamspaceRelationsLoader === "init-loader",
      },
      {
        key: ERelationType.BLOCKED_BY,
        label: "Blocked",
        content: <TeamspaceRelationIssueList teamspaceId={teamspaceId} type={ERelationType.BLOCKED_BY} />,
        disabled: teamspaceRelationsLoader === "init-loader",
      },
    ],
    [teamspaceId, teamspaceRelationsLoader]
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
            teamspaceRelationsLoader === "init-loader" && "cursor-not-allowed"
          )}
        />
      }
      className="py-2"
    >
      <>
        <div ref={relationsContainerRef} className="flex w-full h-full">
          <Tabs
            tabs={TEAM_RELATION_TYPE_LIST}
            storageKey={`teamspace-relations-${teamspaceId}`}
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
