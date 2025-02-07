import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
// components
import { EIssuesStoreType, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EmptyState } from "@/components/common";
// constants
// hooks
import { useCommandPalette, useEventTracker, useUserPermissions } from "@/hooks/store";
// assets
import emptyIssue from "@/public/empty-state/issue.svg";

export const ProjectViewEmptyState: React.FC = observer(() => {
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  // auth
  const isCreatingIssueAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className="grid h-full w-full place-items-center">
      <EmptyState
        title="View work items will appear here"
        description="Work items help you track individual pieces of work. With work items, keep track of what's going on, who is working on it, and what's done."
        image={emptyIssue}
        primaryButton={
          isCreatingIssueAllowed
            ? {
                text: "New work item",
                icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
                onClick: () => {
                  setTrackElement("View work item empty state");
                  toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
                },
              }
            : undefined
        }
      />
    </div>
  );
});
