import { useState } from "react";
import { useRouter } from "next/router";
import { CustomMenu } from "@plane/ui";
import { Copy, Link, Pencil, Trash2 } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// components
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { TIssue } from "@plane/types";
import { IQuickActionProps } from "../list/list-view-types";
// constants
import { EIssuesStoreType } from "constants/issue";

export const AllIssueQuickActions: React.FC<IQuickActionProps> = (props) => {
  const { issue, handleDelete, handleUpdate, customActionButton, portalElement } = props;
  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // toast alert
  const { setToastAlert } = useToast();

  const handleCopyIssueLink = () => {
    copyUrlToClipboard(`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`).then(() =>
      setToastAlert({
        type: "success",
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );
  };

  const duplicateIssuePayload = {
    ...issue,
    name: `${issue.name} (copy)`,
  };
  delete duplicateIssuePayload.id;

  return (
    <>
      <DeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDelete}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
        }}
        data={issueToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) await handleUpdate({ ...issueToEdit, ...data });
        }}
        storeType={EIssuesStoreType.PROJECT}
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
            setIssueToEdit(issue);
            setCreateUpdateIssueModal(true);
          }}
        >
          <div className="flex items-center gap-2">
            <Pencil className="h-3 w-3" />
            Edit issue
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={() => {
            setCreateUpdateIssueModal(true);
          }}
        >
          <div className="flex items-center gap-2">
            <Copy className="h-3 w-3" />
            Make a copy
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
