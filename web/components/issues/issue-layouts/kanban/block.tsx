import { useState } from "react";
import { useRouter } from "next/router";
import { Draggable } from "@hello-pangea/dnd";
import { Copy, Link, Pencil, Trash2 } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// components
import { KanBanProperties } from "./properties";
// ui
import { CustomMenu } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IIssue } from "types";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  index: number;
  issue: IIssue;
  isDragDisabled: boolean;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  displayProperties: any;
}

export const KanbanIssueBlock: React.FC<IssueBlockProps> = (props) => {
  const { sub_group_id, columnId, index, issue, isDragDisabled, handleIssues, displayProperties } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<IIssue | null>(null);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const { setToastAlert } = useToast();

  const updateIssue = (_issue: IIssue) => {
    if (_issue && handleIssues)
      handleIssues(
        !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
        !columnId && columnId === "null" ? null : columnId,
        _issue,
        "update"
      );
  };

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
        onSubmit={async () =>
          handleIssues(
            !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
            !columnId && columnId === "null" ? null : columnId,
            issue,
            "delete"
          )
        }
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
          if (issueToEdit)
            handleIssues(
              !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
              !columnId && columnId === "null" ? null : columnId,
              { ...issueToEdit, ...data },
              "update"
            );
        }}
      />
      <Draggable draggableId={issue.id} index={index} isDragDisabled={isDragDisabled}>
        {(provided, snapshot) => (
          <div
            className="group/kanban-block relative p-1.5 hover:cursor-default"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            <div className="absolute top-3 right-3 hidden group-hover/kanban-block:block">
              <CustomMenu ellipsis>
                <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
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
                <CustomMenu.MenuItem onClick={() => setCreateUpdateIssueModal(true)}>
                  <div className="flex items-center gap-2">
                    <Copy className="h-3 w-3" />
                    Make a copy
                  </div>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                  <div className="flex items-center gap-2 text-red-500">
                    <Trash2 className="h-3 w-3" />
                    Delete issue
                  </div>
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
            <div
              className={`text-sm rounded p-2 px-3 shadow-custom-shadow-2xs space-y-[8px] border transition-all bg-custom-background-100 hover:cursor-grab ${
                snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`
              }`}
            >
              {displayProperties && displayProperties?.key && (
                <div className="text-xs line-clamp-1 text-custom-text-300">
                  {issue.project_detail.identifier}-{issue.sequence_id}
                </div>
              )}
              <div className="line-clamp-2 h-[40px] text-sm font-medium text-custom-text-100">{issue.name}</div>
              <div>
                <KanBanProperties
                  sub_group_id={sub_group_id}
                  columnId={columnId}
                  issue={issue}
                  handleIssues={updateIssue}
                  display_properties={displayProperties}
                />
              </div>
            </div>
          </div>
        )}
      </Draggable>
    </>
  );
};
