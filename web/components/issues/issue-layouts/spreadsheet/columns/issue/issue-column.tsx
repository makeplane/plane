import React, { useState } from "react";
import { useRouter } from "next/router";
import { Popover2 } from "@blueprintjs/popover2";
import { MoreHorizontal, LinkIcon, Pencil, Trash2, ChevronRight } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  expanded: boolean;
  handleToggleExpand: (issueId: string) => void;
  properties: Properties;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  disableUserActions: boolean;
  nestingLevel: number;
};

export const IssueColumn: React.FC<Props> = ({
  issue,
  projectId,
  expanded,
  handleToggleExpand,
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

  const openPeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssue: issue.id },
    });
  };

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`).then(() => {
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
                        className="hover:text-custom-text-200 w-full select-none gap-2 rounded p-1 text-left text-custom-text-200 hover:bg-custom-background-80"
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

                      <button
                        type="button"
                        className="hover:text-custom-text-200 w-full select-none gap-2 rounded p-1 text-left text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          handleCopyText();
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3 w-3" />
                          <span>Copy issue link</span>
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
      <span className="flex items-center px-4 py-2.5 h-full  truncate flex-grow">
        <button
          type="button"
          className="truncate text-custom-text-100 text-left cursor-pointer w-full text-[0.825rem]"
          onClick={openPeekOverview}
        >
          {issue.name}
        </button>
      </span>
    </div>
  );
};
