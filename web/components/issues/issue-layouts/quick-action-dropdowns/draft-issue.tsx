import { useState } from "react";
import { CustomMenu } from "@plane/ui";
import { Copy, Pencil, Trash2 } from "lucide-react";
// components
import { CreateUpdateDraftIssueModal, DeleteDraftIssueModal } from "components/draft-issues";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  handleUpdate: (data: IIssue, action: any) => Promise<void> | void;
};

export const DraftIssueQuickActions: React.FC<Props> = (props) => {
  const { issue, handleUpdate } = props;

  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<IIssue | null>(null);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  return (
    <>
      <DeleteDraftIssueModal data={issue} isOpen={deleteIssueModal} handleClose={() => setDeleteIssueModal(false)} />
      <CreateUpdateDraftIssueModal
        isOpen={createUpdateIssueModal}
        handleClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(null);
        }}
        initialData={issueToEdit ? { ...issueToEdit } : { ...issue, name: issue?.name, description: issue.description }}
      />
      <CustomMenu ellipsis>
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
            Edit draft issue
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleUpdate(issue, "convertToIssue");
          }}
        >
          <div className="flex items-center gap-2">
            <Copy className="h-3 w-3" />
            Convert to issue
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
            Delete draft issue
          </div>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </>
  );
};
