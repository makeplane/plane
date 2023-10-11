import React, { useState } from "react";

import { useRouter } from "next/router";

// components
import { Popover2 } from "@blueprintjs/popover2";
// icons
import { Icon } from "components/ui";
import { EllipsisHorizontalIcon, LinkIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
// hooks
import useToast from "hooks/use-toast";
// types
import { IIssue, Properties } from "types";
// helper
import { copyTextToClipboard } from "helpers/string.helper";

type Props = {
  issue: IIssue;
  projectId: string;
  expanded: boolean;
  handleToggleExpand: (issueId: string) => void;
  properties: Properties;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  setCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>;
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
  setCurrentProjectId,
  disableUserActions,
  nestingLevel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const openPeekOverview = () => {
    const { query } = router;
    setCurrentProjectId(issue.project_detail.id);
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
    <div className="group flex items-center w-[28rem] text-sm h-11 sticky top-0 bg-custom-background-100 truncate border-b border-r border-custom-border-100">
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
                    <div
                      className={`flex flex-col gap-1.5 overflow-y-scroll whitespace-nowrap rounded-md border p-1 text-xs shadow-lg focus:outline-none max-h-44 min-w-full border-custom-border-100 bg-custom-background-90`}
                    >
                      <button
                        type="button"
                        className="hover:text-custom-text-200 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          handleEditIssue(issue);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-start gap-2">
                          <PencilIcon className="h-4 w-4" />
                          <span>Edit issue</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="hover:text-custom-text-200 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          handleDeleteIssue(issue);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-start gap-2">
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete issue</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="hover:text-custom-text-200 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          handleCopyText();
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-start gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <span>Copy issue link</span>
                        </div>
                      </button>
                    </div>
                  }
                  placement="bottom-start"
                >
                  <EllipsisHorizontalIcon className="h-5 w-5 text-custom-text-200" />
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
                <Icon iconName="chevron_right" className={`${expanded ? "rotate-90" : ""}`} />
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
