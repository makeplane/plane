import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Sidebar } from "lucide-react";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues";
// plane web components
import { cn } from "@/helpers/common.helper";
import { TeamQuickActions } from "@/plane-web/components/teams/actions";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

type TeamOverviewHeaderActionsProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamOverviewHeaderActions = observer((props: TeamOverviewHeaderActionsProps) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { isTeamSidebarCollapsed, toggleTeamsSidebar, getTeamNameDescriptionLoaderById } = useTeams();
  // derived values
  const isSubmitting = getTeamNameDescriptionLoaderById(teamId);

  if (!workspaceSlug) return;

  return (
    <>
      {isSubmitting && <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />}
      <TeamQuickActions
        teamId={teamId?.toString()}
        workspaceSlug={workspaceSlug?.toString()}
        parentRef={null}
        isEditingAllowed={isEditingAllowed}
        hideEdit
      />
      <Sidebar
        className={cn("size-4 cursor-pointer select-none", {
          "text-custom-primary-100": !isTeamSidebarCollapsed,
        })}
        onClick={() => toggleTeamsSidebar(!isTeamSidebarCollapsed)}
      />
    </>
  );
});
