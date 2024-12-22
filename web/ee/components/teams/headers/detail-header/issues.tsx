import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EIssuesStoreType } from "@plane/constants";
// components
import { Button } from "@plane/ui";
// hooks
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamHeaderFilters } from "@/plane-web/components/teams/issues/filters";
// plane web hooks
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type TeamIssueListHeaderActionsProps = {
  teamId: string;
};

export const TeamIssueListHeaderActions = observer((props: TeamIssueListHeaderActionsProps) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateIssueModal } = useCommandPalette();
  // derived values
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!workspaceSlug) return;

  return (
    <>
      <div className="hidden gap-3 md:flex">
        <TeamHeaderFilters teamId={teamId} workspaceSlug={workspaceSlug.toString()} />
      </div>
      {canUserCreateIssue ? (
        <Button
          onClick={() => {
            toggleCreateIssueModal(true, EIssuesStoreType.TEAM);
          }}
          size="sm"
        >
          <div className="hidden sm:block">Add</div> Issue
        </Button>
      ) : (
        <></>
      )}
    </>
  );
});
