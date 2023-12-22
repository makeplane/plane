import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// hooks
import { useApplication, useUser } from "hooks/store";
// components
import { NewEmptyState } from "components/common/new-empty-state";
// constants
import { EUserProjectRoles } from "constants/project";
// assets
import emptyIssue from "public/empty-state/empty_issues.webp";
import { EIssuesStoreType } from "constants/issue";

export const ProjectEmptyState: React.FC = observer(() => {
  // store hooks
  const {
    commandPalette: commandPaletteStore,
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <div className="grid h-full w-full place-items-center">
      <NewEmptyState
        title="Create an issue and assign it to someone, even yourself"
        description="Think of issues as jobs, tasks, work, or JTBD. Which we like. An issue and its sub-issues are usually time-based actionables assigned to members of your team. Your team creates, assigns, and completes issues to move your project towards its goal."
        image={emptyIssue}
        comicBox={{
          title: "Issues are building blocks in Plane.",
          direction: "left",
          description:
            "Redesign the Plane UI, Rebrand the company, or Launch the new fuel injection system are examples of issues that likely have sub-issues.",
        }}
        primaryButton={{
          text: "Create your first issue",
          icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
          onClick: () => {
            setTrackElement("PROJECT_EMPTY_STATE");
            commandPaletteStore.toggleCreateIssueModal(true, EIssuesStoreType.PROJECT);
          },
        }}
        disabled={!isEditingAllowed}
      />
    </div>
  );
});
