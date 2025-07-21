import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
// components
import { EUserPermissions, EUserPermissionsLevel, WORK_ITEM_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
import { EmptyState } from "@/components/common";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
// assets
import emptyIssue from "@/public/empty-state/issue.svg";

export const ProjectViewEmptyState: React.FC = observer(() => {
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
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
                  captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON.PROJECT_VIEW });
                  toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW);
                },
              }
            : undefined
        }
      />
    </div>
  );
});
