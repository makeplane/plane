import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { ArchiveRestoreIcon, ExternalLink, Link, Trash2 } from "lucide-react";
// ui
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DeleteIssueModal } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssues, useUser } from "@/hooks/store";
// types
import { IQuickActionProps } from "../list/list-view-types";

export const ArchivedIssueQuickActions: React.FC<IQuickActionProps> = observer((props) => {
  const { issue, handleDelete, handleRestore, customActionButton, portalElement, readOnly = false } = props;
  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { setTrackElement } = useEventTracker();
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  // derived values
  const activeLayout = `${issuesFilter.issueFilters?.displayFilters?.layout} layout`;
  // auth
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER && !readOnly;
  const isRestoringAllowed = handleRestore && isEditingAllowed;

  const issueLink = `${workspaceSlug}/projects/${issue.project_id}/archives/issues/${issue.id}`;

  const handleOpenInNewTab = () => window.open(`/${issueLink}`, "_blank");
  const handleCopyIssueLink = () =>
    copyUrlToClipboard(issueLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );
  const handleIssueRestore = async () => {
    if (!handleRestore) return;
    await handleRestore()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your issue can be found in project issues.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Issue could not be restored. Please try again.",
        });
      });
  };

  return (
    <>
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />
      <CustomMenu
        menuItemsClassName="z-[14]"
        placement="bottom-start"
        customButton={customActionButton}
        portalElement={portalElement}
        maxHeight="lg"
        closeOnSelect
        ellipsis
      >
        {isRestoringAllowed && (
          <CustomMenu.MenuItem onClick={handleIssueRestore}>
            <div className="flex items-center gap-2">
              <ArchiveRestoreIcon className="h-3 w-3" />
              Restore
            </div>
          </CustomMenu.MenuItem>
        )}
        <CustomMenu.MenuItem onClick={handleOpenInNewTab}>
          <div className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
          <div className="flex items-center gap-2">
            <Link className="h-3 w-3" />
            Copy link
          </div>
        </CustomMenu.MenuItem>
        {isEditingAllowed && (
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
});
