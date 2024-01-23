import { useState } from "react";
import { useRouter } from "next/router";
import { CustomMenu } from "@plane/ui";
import { Link, Trash2 } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// components
import { DeleteArchivedIssueModal } from "components/issues";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IQuickActionProps } from "../list/list-view-types";

export const ArchivedIssueQuickActions: React.FC<IQuickActionProps> = (props) => {
  const { issue, handleDelete, customActionButton, portalElement } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const { setToastAlert } = useToast();

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
        <CustomMenu.MenuItem
          onClick={() => {
            setDeleteIssueModal(true);
          }}
        >
          <div className="flex items-center gap-2">
            <Trash2 className="h-3 w-3" />
            Delete issue
          </div>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </>
  );
};
