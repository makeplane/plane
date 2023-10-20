import { FC, useState } from "react";
import { useRouter } from "next/router";
import { Copy, Link, Pencil, Trash2 } from "lucide-react";
// components
import { KanBanProperties } from "./properties";
import { IssuePeekOverview } from "components/issues/issue-peek-overview";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Tooltip, CustomMenu } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IIssue } from "types";

interface IssueBlockProps {
  columnId: string;
  issue: IIssue;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  priorities: any;
}

export const IssueBlock: FC<IssueBlockProps> = (props) => {
  const { columnId, issue, handleIssues, display_properties, states, labels, members, priorities } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  // states
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<IIssue | null>(null);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const { setToastAlert } = useToast();

  const updateIssue = (_issue: IIssue) => {
    if (_issue && handleIssues) handleIssues(!columnId && columnId === "null" ? null : columnId, _issue, "update");
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
        onSubmit={async () => handleIssues(!columnId && columnId === "null" ? null : columnId, issue, "delete")}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        handleClose={() => setCreateUpdateIssueModal(false)}
        // pre-populate date only if not editing
        prePopulateData={!issueToEdit ? { ...issue, name: `${issue.name} (copy)` } : {}}
        data={issueToEdit}
        onSubmit={async (data) => {
          if (issueToEdit)
            handleIssues(!columnId && columnId === "null" ? null : columnId, { ...issueToEdit, ...data }, "update");
        }}
      />
      <div className="text-sm p-3 shadow-custom-shadow-2xs bg-custom-background-100 flex items-center gap-3 border-b border-custom-border-200 hover:bg-custom-background-80">
        {display_properties && display_properties?.key && (
          <div className="flex-shrink-0 text-xs text-custom-text-300">
            {issue?.project_detail?.identifier}-{issue.sequence_id}
          </div>
        )}
        <IssuePeekOverview
          workspaceSlug={issue?.workspace_detail?.slug}
          projectId={issue?.project_detail?.id}
          issueId={issue?.id}
          // TODO: add the logic here
          handleIssue={() => {}}
        >
          <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
            <div className="line-clamp-1 text-sm font-medium text-custom-text-100 w-full">{issue.name}</div>
          </Tooltip>
        </IssuePeekOverview>

        <div className="ml-auto flex-shrink-0 flex items-center gap-2">
          <KanBanProperties
            columnId={columnId}
            issue={issue}
            handleIssues={updateIssue}
            display_properties={display_properties}
            states={states}
            labels={labels}
            members={members}
            priorities={priorities}
          />
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
      </div>
    </>
  );
};
