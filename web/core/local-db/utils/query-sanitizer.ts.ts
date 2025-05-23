// plane constants
import { EUserPermissions } from "@plane/constants";
import { TIssueParams } from "@plane/types";
// root store
import { rootStore } from "@/lib/store-context";

export const sanitizeWorkItemQueries = (
  workspaceSlug: string,
  projectId: string,
  queries: Partial<Record<TIssueParams, string | boolean>> | undefined
): Partial<Record<TIssueParams, string | boolean>> | undefined => {
  // Get current project details and user id and role for the project
  const currentProject = rootStore.projectRoot.project.getProjectById(projectId);
  const currentUserId = rootStore.user.data?.id;
  const currentUserRole = rootStore.user.permission.getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);

  // Only apply this restriction for guests when guest_view_all_features is disabled
  if (
    currentUserId &&
    currentUserRole === EUserPermissions.GUEST &&
    currentProject?.guest_view_all_features === false
  ) {
    // Sanitize the created_by filter if it doesn't exist or if it exists and includes the current user id
    const existingCreatedByFilter = queries?.created_by;
    const shouldApplyFilter =
      !existingCreatedByFilter ||
      (typeof existingCreatedByFilter === "string" && existingCreatedByFilter.includes(currentUserId));

    if (shouldApplyFilter) {
      queries = {
        ...queries,
        created_by: currentUserId,
      };
    }
  }

  return queries;
};
