import React, { useState } from "react";
import { useRouter } from "next/router";
import { Popover2 } from "@blueprintjs/popover2";
import { MoreHorizontal, Pencil, Trash2, ChevronRight, Link } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// components
import { IssuePeekOverview } from "components/issues/issue-peek-overview";
import { Tooltip } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IIssue, IIssueDisplayProperties } from "types";

type Props = {
  issue: IIssue;
  expanded: boolean;
  handleToggleExpand: (issueId: string) => void;
  handleUpdateIssue: (issue: IIssue, data: Partial<IIssue>) => void;
  properties: IIssueDisplayProperties;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  disableUserActions: boolean;
  nestingLevel: number;
};

export const IssueColumn: React.FC<Props> = ({
  issue,
  expanded,
  handleToggleExpand,
  handleUpdateIssue,
  properties,
  handleEditIssue,
  handleDeleteIssue,
  disableUserActions,
  nestingLevel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const paddingLeft = `${nestingLevel * 54}px`;

  return (
    <div className="group flex items-center w-[28rem] text-sm h-11 sticky top-0 bg-custom-background-100 truncate border-b border-custom-border-100">
      {properties.key && (
        <div
          className="flex gap-1.5 px-4 pr-0 py-2.5 items-center min-w-[96px]"
          style={issue.parent && nestingLevel !== 0 ? { paddingLeft } : {}}
        >
          <div className="relative flex items-center cursor-pointer text-xs text-center hover:text-custom-text-100">
            <span className="flex items-center justify-center font-medium opacity-100 group-hover:opacity-0 ">
              {issue.project_detail?.identifier}-{issue.sequence_id}
            </span>

            {!disableUserActions && (
              <div className="absolute top-0 left-2.5 opacity-0 group-hover:opacity-100">
                <Popover2
                  isOpen={isOpen}
                  canEscapeKeyClose
                  onInteraction={(nextOpenState) => setIsOpen(nextOpenState)}
                  content={
                    <div className="flex flex-col whitespace-nowrap rounded-md border border-custom-border-100 p-1 text-xs shadow-lg focus:outline-none min-w-full bg-custom-background-100 space-y-0.5">
                      <button
                        type="button"
                        className="hover:text-custom-text-200 w-full select-none gap-2 rounded p-1 text-left text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          handleCopyText();
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Link className="h-3 w-3" />
                          <span>Copy link</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="hover:text-custom-text-200 w-full select-none gap-2 rounded p-1 text-left text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          handleEditIssue(issue);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Pencil className="h-3 w-3" />
                          <span>Edit issue</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="w-full select-none gap-2 rounded p-1 text-left text-red-500 hover:bg-custom-background-80"
                        onClick={() => {
                          handleDeleteIssue(issue);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-3 w-3" />
                          <span>Delete issue</span>
                        </div>
                      </button>
                    </div>
                  }
                  placement="bottom-start"
                >
                  <MoreHorizontal className="h-5 w-5 text-custom-text-200" />
                </Popover2>
              </div>
            )}
          </div>

          {issue.sub_issues_count > 0 && (
            <div className="h-6 w-6 flex justify-center items-center">
              <button
                className="h-5 w-5 hover:bg-custom-background-90 hover:text-custom-text-100 rounded-sm cursor-pointer"
                onClick={() => handleToggleExpand(issue.id)}
              >
                <ChevronRight className={`h-3.5 w-3.5 ${expanded ? "rotate-90" : ""}`} />
              </button>
            </div>
          )}
        </div>
      )}
      <IssuePeekOverview
        workspaceSlug={issue?.workspace_detail?.slug}
        projectId={issue?.project_detail?.id}
        issueId={issue?.id}
        handleIssue={(issueToUpdate) => handleUpdateIssue(issueToUpdate as IIssue, issueToUpdate)}
      >
        <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
          <span className="flex items-center px-4 py-2.5 h-full  truncate flex-grow">
            <div className="truncate text-custom-text-100 text-left cursor-pointer w-full text-[0.825rem]">
              {issue.name}
            </div>
          </span>
        </Tooltip>
      </IssuePeekOverview>
    </div>
  );
};
