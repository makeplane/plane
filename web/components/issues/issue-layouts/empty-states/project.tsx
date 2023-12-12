import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { NewEmptyState } from "components/common/new-empty-state";
// assets
import emptyIssue from "public/empty-state/empty_issues.webp";
import { EProjectStore } from "store/command-palette.store";

export const ProjectEmptyState: React.FC = observer(() => {
  const {
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
  } = useMobxStore();

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
            commandPaletteStore.toggleCreateIssueModal(true, EProjectStore.PROJECT);
          },
        }}
      />
    </div>
  );
});
