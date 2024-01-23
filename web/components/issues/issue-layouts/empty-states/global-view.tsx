import { observer } from "mobx-react-lite";
import { Plus, PlusIcon } from "lucide-react";
// hooks
import { useApplication, useProject } from "hooks/store";
// components
import { EmptyState } from "components/common";
// assets
import emptyIssue from "public/empty-state/issue.svg";
import emptyProject from "public/empty-state/project.svg";

export const GlobalViewEmptyState: React.FC = observer(() => {
  // store hooks
  const {
    commandPalette: { toggleCreateIssueModal, toggleCreateProjectModal },
    eventTracker: { setTrackElement },
  } = useApplication();
  const { workspaceProjectIds } = useProject();

  return (
    <div className="grid h-full w-full place-items-center">
      {!workspaceProjectIds || workspaceProjectIds?.length === 0 ? (
        <EmptyState
          image={emptyProject}
          title="No projects yet"
          description="Get started by creating your first project"
          primaryButton={{
            icon: <Plus className="h-4 w-4" />,
            text: "New Project",
            onClick: () => {
              setTrackElement("ALL_ISSUES_EMPTY_STATE");
              toggleCreateProjectModal(true);
            },
          }}
        />
      ) : (
        <EmptyState
          title="View issues will appear here"
          description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
          image={emptyIssue}
          primaryButton={{
            text: "New issue",
            icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
            onClick: () => {
              setTrackElement("ALL_ISSUES_EMPTY_STATE");
              toggleCreateIssueModal(true);
            },
          }}
        />
      )}
    </div>
  );
});
