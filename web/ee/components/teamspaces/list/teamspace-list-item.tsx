import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Logo, TeamsIcon } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list/list-item";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { TeamProperties, TeamQuickActions, JoinTeamspaceButton } from "@/plane-web/components/teamspaces/actions";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces";

type TeamspaceListItemProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceListItem = observer((props: TeamspaceListItemProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const parentRef = useRef(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // plane web hooks
  const { getTeamspaceById, isUserMemberOfTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const isTeamspaceMember = isUserMemberOfTeamspace(teamspaceId);

  if (!teamspace) return null;
  return (
    <ListItem
      title={teamspace.name}
      itemLink={`/${workspaceSlug?.toString()}/teamspaces/${teamspace.id}`}
      prependTitleElement={
        <div className="flex flex-shrink-0 size-8 items-center justify-center rounded-md bg-custom-background-90">
          {teamspace.logo_props?.in_use ? (
            <Logo logo={teamspace.logo_props} size={16} />
          ) : (
            <TeamsIcon className="size-4 text-custom-text-300" />
          )}
        </div>
      }
      quickActionElement={
        <>
          {isTeamspaceMember ? (
            <>
              <TeamProperties teamspaceId={teamspaceId} isEditingAllowed={isEditingAllowed} />
              <TeamQuickActions
                parentRef={parentRef}
                teamspaceId={teamspaceId}
                workspaceSlug={workspaceSlug.toString()}
                isEditingAllowed={isEditingAllowed && isTeamspaceMember}
              />
            </>
          ) : (
            <JoinTeamspaceButton teamspaceId={teamspaceId} />
          )}
        </>
      }
      isMobile={isMobile}
      parentRef={parentRef}
      disableLink={!isTeamspaceMember}
    />
  );
});
