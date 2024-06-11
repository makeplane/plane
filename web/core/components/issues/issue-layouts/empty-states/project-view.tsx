import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
// components
import { EmptyState } from "@/components/common";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCommandPalette, useEventTracker, useUser } from "@/hooks/store";
// assets
import emptyIssue from "@/public/empty-state/issue.svg";

export const ProjectViewEmptyState: React.FC = observer(() => {
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  // auth
  const isCreatingIssueAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <div className="grid h-full w-full place-items-center">
      <EmptyState
        title="View issues will appear here"
        description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
        image={emptyIssue}
        primaryButton={
          isCreatingIssueAllowed
            ? {
                text: "New issue",
                icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
                onClick: () => {
                  setTrackElement("View issue empty state");
                  toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
                },
              }
            : undefined
        }
      />
    </div>
  );
});
