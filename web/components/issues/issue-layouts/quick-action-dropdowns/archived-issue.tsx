import { useState } from "react";
import { useRouter } from "next/router";
import { CustomMenu } from "@plane/ui";
import { Link, Trash2 } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
import { useEventTracker, useIssues ,useUser} from "hooks/store";
// components
import { DeleteArchivedIssueModal } from "components/issues";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IQuickActionProps } from "../list/list-view-types";
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

export const ArchivedIssueQuickActions: React.FC<IQuickActionProps> = (props) => {
  const { issue, handleDelete, customActionButton, portalElement, readOnly = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // toast alert
  const { setToastAlert } = useToast();

  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;

  const handleCopyIssueLink = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${issue.project}/archived-issues/${issue.id}`).then(() =>
      setToastAlert({
        type: "success",
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );
  };

  return (
    <>
      <DeleteArchivedIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />
      <CustomMenu
        placement="bottom-start"
        customButton={customActionButton}
        portalElement={portalElement}
        closeOnSelect
        ellipsis
      >
        <CustomMenu.MenuItem
          onClick={() => {
            handleCopyIssueLink();
          }}
        >
          <div className="flex items-center gap-2">
            <Link className="h-3 w-3" />
            Copy link
          </div>
        </CustomMenu.MenuItem>
        {isEditingAllowed && !readOnly && (
          <CustomMenu.MenuItem
            onClick={() => {
              setTrackElement(activeLayout);
            setDeleteIssueModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-3 w-3" />
              Delete issue
            </div>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
    </>
  );
};
