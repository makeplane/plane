"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
// types
import { TTeamView } from "@plane/types";
// components
import { Logo } from "@/components/common";
import { ListItem } from "@/components/core/list";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { TeamViewListItemAction, TeamViewQuickActions } from "@/plane-web/components/teams/views";

type Props = {
  teamId: string;
  view: TTeamView;
};

export const TeamViewListItem: FC<Props> = observer((props) => {
  const { teamId, view } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { isMobile } = usePlatformOS();
  // derived values
  const detailPageLink = view.is_team_view
    ? `/${workspaceSlug}/teams/${view.team}/views/${view.id}`
    : `/${workspaceSlug}/projects/${view.project}/views/${view.id}`;

  return (
    <ListItem
      prependTitleElement={
        <>
          {view?.logo_props?.in_use ? (
            <Logo logo={view?.logo_props} size={16} type="lucide" />
          ) : (
            <Layers className="h-4 w-4 text-custom-text-300" />
          )}
        </>
      }
      title={view.name}
      itemLink={detailPageLink}
      actionableItems={<TeamViewListItemAction parentRef={parentRef} teamId={teamId} view={view} />}
      quickActionElement={
        <div className="block md:hidden">
          <TeamViewQuickActions
            parentRef={parentRef}
            teamId={teamId}
            view={view}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
