import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserPermissions, EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType } from "@plane/types";
// components
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";

export const ProjectViewEmptyState = observer(function ProjectViewEmptyState() {
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();

  // auth
  const isCreatingIssueAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const currentProjectRole = workspaceSlug && projectId ? getProjectRoleByWorkspaceSlugAndProjectId(
    workspaceSlug.toString(),
    projectId.toString()
  ) : undefined;

  const roleNumber = currentProjectRole ? Number(currentProjectRole) : undefined;
  const canUserCreateWorkItem = isCreatingIssueAllowed && roleNumber !== EUserPermissions.SUPERVISOR && roleNumber !== EUserPermissions.EXECUTOR;

  return (
    // TODO: Add translation
    <EmptyStateDetailed
      assetKey="work-item"
      title="View work items will appear here"
      description="Work items help you track individual pieces of work. With work items, keep track of what's going on, who is working on it, and what's done."
      actions={canUserCreateWorkItem ? [
        {
          label: "New work item",
          onClick: () => {
            captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.PROJECT_VIEW });
            toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
          },
          disabled: !canUserCreateWorkItem,
          variant: "primary",
        },
      ] : []}
    />
  );
});
