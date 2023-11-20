import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { EmptyState } from "components/common";
// assets
import emptyIssue from "public/empty-state/issue.svg";

export const ProjectViewEmptyState: React.FC = observer(() => {
  const { commandPalette: commandPaletteStore } = useMobxStore();

  return (
    <div className="h-full w-full grid place-items-center">
      <EmptyState
        title="View issues will appear here"
        description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
        image={emptyIssue}
        primaryButton={{
          text: "New issue",
          icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
          onClick: () => commandPaletteStore.toggleCreateIssueModal(true),
        }}
      />
    </div>
  );
});
