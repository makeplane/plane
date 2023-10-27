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
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  handleDelete: () => Promise<void>;
  handleUpdate: (data: IIssue) => Promise<void>;
  handleRemoveFromModule: () => Promise<void>;
};

export const ModuleIssueQuickActions: React.FC<Props> = (props) => {
  const { issue, handleDelete, handleUpdate, handleRemoveFromModule } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<IIssue | null>(null);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

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
          if (issueToEdit) handleUpdate({ ...issueToEdit, ...data });
        }}
      />
      <CustomMenu ellipsis>
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRemoveFromModule();
          }}
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-3 w-3" />
            Remove from module
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
