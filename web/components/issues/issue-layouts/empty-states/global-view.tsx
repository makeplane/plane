import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EMPTY_STATE_DETAILS, EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useCommandPalette, useEventTracker, useProject } from "@/hooks/store";
// assets

export const GlobalViewEmptyState: React.FC = observer(() => {
  const { globalViewId } = useParams();
  // store hooks
  const { workspaceProjectIds } = useProject();
  const { toggleCreateIssueModal, toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();

  const isDefaultView = ["all-issues", "assigned", "created", "subscribed"].includes(globalViewId?.toString() ?? "");
  const currentView = isDefaultView && globalViewId ? globalViewId : "custom-view";

  const emptyStateType =
    (workspaceProjectIds ?? []).length > 0 ? `workspace-${currentView}` : EmptyStateType.WORKSPACE_NO_PROJECTS;

  return (
    <EmptyState
      type={emptyStateType as keyof typeof EMPTY_STATE_DETAILS}
      size="sm"
      primaryButtonOnClick={
        (workspaceProjectIds ?? []).length > 0
          ? currentView !== "custom-view" && currentView !== "subscribed"
            ? () => {
                setTrackElement("All issues empty state");
                toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
              }
            : undefined
          : () => {
              setTrackElement("All issues empty state");
              toggleCreateProjectModal(true);
            }
      }
    />
  );
});
