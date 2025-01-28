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
import { TeamProperties, TeamQuickActions, JoinTeamButton } from "@/plane-web/components/teams/actions";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store/teams";

type TeamListItemProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamListItem = observer((props: TeamListItemProps) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // refs
  const parentRef = useRef(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // plane web hooks
  const { getTeamById, isUserMemberOfTeam } = useTeams();
  // derived values
  const team = getTeamById(teamId);
  const isTeamMember = isUserMemberOfTeam(teamId);

  if (!team) return null;
  return (
    <ListItem
      title={team.name}
      itemLink={`/${workspaceSlug?.toString()}/teams/${team.id}`}
      prependTitleElement={
        <div className="flex flex-shrink-0 size-8 items-center justify-center rounded-md bg-custom-background-90">
          {team.logo_props?.in_use ? (
            <Logo logo={team.logo_props} size={16} />
          ) : (
            <TeamsIcon className="size-4 text-custom-text-300" />
          )}
        </div>
      }
      quickActionElement={
        <>
          {isTeamMember ? (
            <>
              <TeamProperties teamId={teamId} isEditingAllowed={isEditingAllowed} />
              <TeamQuickActions
                parentRef={parentRef}
                teamId={teamId}
                workspaceSlug={workspaceSlug.toString()}
                isEditingAllowed={isEditingAllowed && isTeamMember}
              />
            </>
          ) : (
            <JoinTeamButton teamId={teamId} />
          )}
        </>
      }
      isMobile={isMobile}
      parentRef={parentRef}
      disableLink={!isTeamMember}
    />
  );
});
