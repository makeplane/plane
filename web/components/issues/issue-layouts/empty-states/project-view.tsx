import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// hooks
import { useApplication } from "hooks/store";
// components
import { EmptyState } from "components/common";
// assets
import emptyIssue from "public/empty-state/issue.svg";
import { EIssuesStoreType } from "constants/issue";

export const ProjectViewEmptyState: React.FC = observer(() => {
  // store hooks
  const {
    commandPalette: commandPaletteStore,
    eventTracker: { setTrackElement },
  } = useApplication();

  return (
    <div className="grid h-full w-full place-items-center">
      <EmptyState
        title="View issues will appear here"
        description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
        image={emptyIssue}
        primaryButton={{
          text: "New issue",
          icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
          onClick: () => {
            setTrackElement("VIEW_EMPTY_STATE");
            commandPaletteStore.toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
          },
        }}
      />
    </div>
  );
});
