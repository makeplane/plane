import React, { useRef, useState } from "react";
import { useRouter } from "next/router";
import { ChevronRight, MoreHorizontal } from "lucide-react";
// components
import { Tooltip } from "@plane/ui";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// types
import { IIssue, IIssueDisplayProperties } from "types";

type Props = {
  issue: IIssue;
  expanded: boolean;
  handleToggleExpand: (issueId: string) => void;
  properties: IIssueDisplayProperties;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
  nestingLevel: number;
};

export const IssueColumn: React.FC<Props> = ({
  issue,
  expanded,
  handleToggleExpand,
  properties,
  quickActions,
  canEditProperties,
  nestingLevel,
}) => {
  // router
  const router = useRouter();
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);

  const menuActionRef = useRef<HTMLDivElement | null>(null);

  const handleIssuePeekOverview = (issue: IIssue, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { query } = router;
    if (event.ctrlKey || event.metaKey) {
      const issueUrl = `/${issue.workspace_detail.slug}/projects/${issue.project_detail.id}/issues/${issue?.id}`;
      window.open(issueUrl, "_blank"); // Open link in a new tab
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
      });
    }
  };

  const paddingLeft = `${nestingLevel * 54}px`;

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`w-full cursor-pointer rounded p-1 text-custom-sidebar-text-400 hover:bg-custom-background-80 ${
        isMenuActive ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );

  return (
    <>
      <div className="group top-0 flex h-11 w-[28rem] items-center truncate border-b border-custom-border-100 bg-custom-background-100 text-sm">
        {properties.key && (
          <div
            className="flex min-w-min items-center gap-1.5 px-4 py-2.5 pr-0"
            style={issue.parent && nestingLevel !== 0 ? { paddingLeft } : {}}
          >
            <div className="relative flex cursor-pointer items-center text-center text-xs hover:text-custom-text-100">
              <span
                className={`flex items-center justify-center font-medium opacity-100 group-hover:opacity-0 ${
                  isMenuActive ? "!opacity-0" : ""
                } `}
              >
                {issue.project_detail?.identifier}-{issue.sequence_id}
              </span>

              {canEditProperties(issue.project) && (
                <div className={`absolute left-2.5 top-0 hidden group-hover:block ${isMenuActive ? "!block" : ""}`}>
                  {quickActions(issue, customActionButton)}
                </div>
              )}
            </div>

            {issue.sub_issues_count > 0 && (
              <div className="flex h-6 w-6 items-center justify-center">
                <button
                  className="h-5 w-5 cursor-pointer rounded-sm hover:bg-custom-background-90 hover:text-custom-text-100"
                  onClick={() => handleToggleExpand(issue.id)}
                >
                  <ChevronRight className={`h-3.5 w-3.5 ${expanded ? "rotate-90" : ""}`} />
                </button>
              </div>
            )}
          </div>
        )}
        <div className="w-full overflow-hidden">
          <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
            <div
              className="h-full w-full cursor-pointer truncate px-4 py-2.5 text-left text-[0.825rem] text-custom-text-100"
              onClick={(e) => handleIssuePeekOverview(issue, e)}
            >
              {issue.name}
            </div>
          </Tooltip>
        </div>
      </div>
    </>
  );
};
