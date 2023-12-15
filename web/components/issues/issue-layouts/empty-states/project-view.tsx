import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { EmptyState } from "components/common";
// assets
import emptyIssue from "public/empty-state/issue.svg";
import { EProjectStore } from "store/command-palette.store";

export const ProjectViewEmptyState: React.FC = observer(() => {
  const {
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
  } = useMobxStore();

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
            commandPaletteStore.toggleCreateIssueModal(true, EProjectStore.PROJECT_VIEW);
          },
        }}
      />
    </div>
  );
});
