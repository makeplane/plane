import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link2, Sidebar } from "lucide-react";
// components
import { setToast, TOAST_TYPE } from "@plane/ui";
import { NameDescriptionUpdateStatus } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// plane web components
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
  const { isTeamSidebarCollapsed, isUserMemberOfTeam, toggleTeamsSidebar, getTeamNameDescriptionLoaderById } =
    useTeams();
  // derived values
  const isTeamMember = isUserMemberOfTeam(teamId);
  const isSubmitting = getTeamNameDescriptionLoaderById(teamId);
  const teamLink = `${workspaceSlug}/teams/${teamId}`;

  const handleCopyText = () =>
    copyUrlToClipboard(teamLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Team link copied to clipboard.",
      });
    });

  const commonButtonClassName =
    "flex-shrink-0 flex items-center justify-center size-6 bg-custom-background-80/70 rounded";

  if (!workspaceSlug || !isTeamMember) return;
  return (
    <div className="flex items-center gap-4">
      {isSubmitting && <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />}
      <div className={cn(commonButtonClassName, "hover:bg-custom-background-80")}>
        <Sidebar
          className={cn("size-4 cursor-pointer select-none text-custom-primary-100", {
            "text-custom-text-300 hover:text-custom-text-200": isTeamSidebarCollapsed,
          })}
          onClick={() => toggleTeamsSidebar(!isTeamSidebarCollapsed)}
        />
      </div>
      <div className={cn(commonButtonClassName, "hover:bg-custom-background-80")}>
        <Link2
          className={cn("-rotate-45 size-4 cursor-pointer select-none text-custom-text-300 hover:text-custom-text-200")}
          onClick={handleCopyText}
        />
      </div>
      <TeamQuickActions
        teamId={teamId?.toString()}
        workspaceSlug={workspaceSlug?.toString()}
        parentRef={null}
        isEditingAllowed={isEditingAllowed && isTeamMember}
        buttonClassName={commonButtonClassName}
        hideEdit
      />
    </div>
  );
});
