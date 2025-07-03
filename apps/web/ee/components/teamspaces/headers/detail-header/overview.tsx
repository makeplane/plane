import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link2, Sidebar } from "lucide-react";
// plane imports
import { TEAMSPACE_TRACKER_ELEMENTS } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues";
// helpers
// plane web components
import { TeamQuickActions } from "@/plane-web/components/teamspaces/actions";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

type TeamOverviewHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamOverviewHeaderActions = observer((props: TeamOverviewHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { isTeamSidebarCollapsed, isCurrentUserMemberOfTeamspace, toggleTeamsSidebar, getTeamspaceNameDescriptionLoaderById } =
    useTeamspaces();
  // derived values
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);
  const isSubmitting = getTeamspaceNameDescriptionLoaderById(teamspaceId);
  const teamLink = `${workspaceSlug}/teamspaces/${teamspaceId}`;

  const handleCopyText = () =>
    copyUrlToClipboard(teamLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Teamspace link copied to clipboard.",
      });
    });

  const commonButtonClassName =
    "flex-shrink-0 flex items-center justify-center size-6 bg-custom-background-80/70 rounded";

  if (!workspaceSlug || !isTeamspaceMember) return;
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
        teamspaceId={teamspaceId?.toString()}
        workspaceSlug={workspaceSlug?.toString()}
        parentRef={null}
        isEditingAllowed={isEditingAllowed && isTeamspaceMember}
        buttonClassName={commonButtonClassName}
        hideEdit
        trackerElement={TEAMSPACE_TRACKER_ELEMENTS.HEADER_QUICK_ACTIONS}
      />
    </div>
  );
});
