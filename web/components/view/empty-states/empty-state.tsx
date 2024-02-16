import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import useSWR from "swr";
// hooks
import { useApplication, useEventTracker, useIssues, useProject, useUser, useView } from "hooks/store";
// components
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// types
import { TViewTypes } from "@plane/types";
// constants
import { ALL_ISSUES_EMPTY_STATE_DETAILS } from "constants/empty-state";
import { EUserWorkspaceRoles } from "constants/workspace";
import { EIssuesStoreType } from "constants/issue";

type TViewEmptyStateRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  children: ReactNode;
};

export const ViewEmptyStateRoot: FC<TViewEmptyStateRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, children } = props;
  // hooks
  const { commandPalette } = useApplication();
  const { resolvedTheme } = useTheme();
  const { workspaceProjectIds } = useProject();
  const {
    currentUser,
    membership: { currentWorkspaceRole },
  } = useUser();
  const { setTrackElement } = useEventTracker();
  const { issueMap } = useIssues();
  const viewStore = useView(workspaceSlug, projectId, viewType);

  const isDefaultView = ["all-issues", "assigned", "created", "subscribed"].includes(viewId);
  const currentView = isDefaultView ? viewId : "custom-view";
  const currentViewDetails = ALL_ISSUES_EMPTY_STATE_DETAILS[currentView as keyof typeof ALL_ISSUES_EMPTY_STATE_DETAILS];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("all-issues", currentView, isLightMode);

  const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  useSWR(
    workspaceSlug && viewId && viewType && viewStore ? `WORKSPACE_VIEWS_${workspaceSlug}_${viewType}` : null,
    async () => {
      if (workspaceSlug && viewType && viewStore)
        await viewStore?.fetch(
          workspaceSlug,
          projectId,
          viewStore?.viewIds.length > 0 ? "view-mutation-loader" : "view-loader"
        );
      await viewStore?.fetchById(workspaceSlug, projectId, viewId);
    }
  );

  const issueIds = projectId ? true : (Object.values(issueMap) ?? []).length === 0;

  if (!workspaceSlug) return <></>;
  return (
    <>
      {(workspaceProjectIds ?? []).length === 0 || issueIds ? (
        <div className="relative w-full h-full">
          <EmptyState
            image={emptyStateImage}
            title={(workspaceProjectIds ?? []).length > 0 ? currentViewDetails.title : "No project"}
            description={
              (workspaceProjectIds ?? []).length > 0
                ? currentViewDetails.description
                : "To create issues or manage your work, you need to create a project or be a part of one."
            }
            size="sm"
            primaryButton={
              (workspaceProjectIds ?? []).length > 0
                ? currentView !== "custom-view" && currentView !== "subscribed"
                  ? {
                      text: "Create new issue",
                      onClick: () => {
                        setTrackElement("All issues empty state");
                        commandPalette.toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
                      },
                    }
                  : undefined
                : {
                    text: "Start your first project",
                    onClick: () => {
                      setTrackElement("All issues empty state");
                      commandPalette.toggleCreateProjectModal(true);
                    },
                  }
            }
            disabled={!isEditingAllowed}
          />
        </div>
      ) : (
        <>{children}</>
      )}
    </>
  );
});
