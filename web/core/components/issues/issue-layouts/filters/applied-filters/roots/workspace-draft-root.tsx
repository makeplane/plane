import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { WorkspaceDraftIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { EIssuesStoreType } from "@/constants/issue";
import { useUserPermissions } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { BaseListRoot } from "../../../list/base-list-root";

export const WorkspaceDraftIssueLayoutRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();

  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // store
  const { allowPermissions } = useUserPermissions();

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;
      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug.toString(),
        projectId
      );
    },
    [workspaceSlug, allowPermissions]
  );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.WORKSPACE_DRAFT}>
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <div className="relative h-full w-full overflow-auto">
          <BaseListRoot
            QuickActions={WorkspaceDraftIssueQuickActions}
            canEditPropertiesBasedOnProject={canEditProperties}
          />
          <IssuePeekOverview is_draft />
        </div>
      </div>
    </IssuesStoreContext.Provider>
  );
});
