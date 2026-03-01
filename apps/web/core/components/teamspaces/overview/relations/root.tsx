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

import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ERelationType } from "@plane/constants";
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleButton } from "@plane/propel/collapsible";
import { Tabs } from "@plane/propel/tabs";
import { cn } from "@plane/utils";
// plane web imports
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";
// local imports
import { TeamspaceRelationIssueList } from "./list";
// dynamic imports
const IssuePeekOverview = lazy(function IssuePeekOverview() {
  return import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }));
});

type Props = {
  teamspaceId: string;
};

export const TeamspaceRelationsRoot = observer(function TeamspaceRelationsRoot(props: Props) {
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
    workspaceSlug && teamspaceId ? () => fetchTeamspaceRelations(workspaceSlug.toString(), teamspaceId) : null,
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
          title="Relations"
          className="border-none px-0"
          titleClassName={cn(
            isOpen ? "text-primary" : "text-tertiary hover:text-secondary",
            teamspaceRelationsLoader === "init-loader" && "cursor-not-allowed"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div ref={relationsContainerRef} className="flex w-full h-full">
          <Tabs defaultValue={TEAM_RELATION_TYPE_LIST[0].key}>
            <Tabs.List className={"w-fit"}>
              {TEAM_RELATION_TYPE_LIST.map((tab) => (
                <Tabs.Trigger key={tab.key} value={tab.key} size="sm">
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <div className="mt-2">
              {TEAM_RELATION_TYPE_LIST.map((tab) => (
                <Tabs.Content key={tab.key} value={tab.key}>
                  {tab.content}
                </Tabs.Content>
              ))}
            </div>
          </Tabs>
        </div>
        <Suspense fallback={<></>}>
          <IssuePeekOverview />
        </Suspense>
      </CollapsibleContent>
    </Collapsible>
  );
});
