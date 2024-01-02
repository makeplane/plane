import { useState } from "react";
import { useRouter } from "next/router";
import { CustomMenu } from "@plane/ui";
import { Copy, Link, Pencil, Trash2, XCircle } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// components
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { TIssue } from "@plane/types";
import { IQuickActionProps } from "../list/list-view-types";
import { EIssuesStoreType } from "constants/issue";

export const CycleIssueQuickActions: React.FC<IQuickActionProps> = (props) => {
  const { issue, handleDelete, handleUpdate, handleRemoveFromView, customActionButton } = props;

  const router = useRouter();
  const { workspaceSlug, cycleId } = router.query;

  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | null>(null);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const { setToastAlert } = useToast();

  const handleCopyIssueLink = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`).then(() =>
      setToastAlert({
        type: "success",
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );
  };

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
        handleClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(null);
        }}
        // pre-populate date only if not editing
        prePopulateData={!issueToEdit && createUpdateIssueModal ? { ...issue, name: `${issue.name} (copy)` } : {}}
        data={issueToEdit}
        onSubmit={async (data) => {
          if (issueToEdit && handleUpdate) handleUpdate({ ...issueToEdit, ...data });
        }}
        currentStore={EIssuesStoreType.CYCLE}
      />
      <CustomMenu placement="bottom-start" customButton={customActionButton} ellipsis>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCopyIssueLink();
          }}
        >
          <div className="flex items-center gap-2">
            <Link className="h-3 w-3" />
            Copy link
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIssueToEdit({
              ...issue,
              cycle: cycleId?.toString() ?? null,
            });
            setCreateUpdateIssueModal(true);
          }}
        >
          <div className="flex items-center gap-2">
            <Pencil className="h-3 w-3" />
            Edit issue
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRemoveFromView && handleRemoveFromView();
          }}
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-3 w-3" />
            Remove from cycle
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCreateUpdateIssueModal(true);
          }}
        >
          <div className="flex items-center gap-2">
            <Copy className="h-3 w-3" />
            Make a copy
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
