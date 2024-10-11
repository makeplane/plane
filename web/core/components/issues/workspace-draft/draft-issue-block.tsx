"use client";
import React, { FC, useRef } from "react";
import { observer } from "mobx-react";
// ui
import { Row, Tooltip } from "@plane/ui";
// helper
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useProject, useWorkspaceDraftIssues } from "@/hooks/store";
// plane-web components
import { IdentifierText } from "ce/components/issues";
// local components
import { WorkspaceDraftIssueQuickActions } from "../issue-layouts";
import { DraftIssueProperties } from "./draft-issue-properties";

type Props = {
  workspaceSlug: string;
  issueId: string;
};

export const DraftIssueBlock: FC<Props> = observer((props) => {
  // props
  const { workspaceSlug, issueId } = props;
  // hooks
  const { getIssueById, updateIssue, deleteIssue, moveIssue } = useWorkspaceDraftIssues();
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { getProjectIdentifierById } = useProject();
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // derived values
  const issue = getIssueById(issueId);
  const projectIdentifier = (issue && issue.project_id && getProjectIdentifierById(issue.project_id)) || undefined;
  if (!issue || !projectIdentifier) return null;

  return (
    <div id={`issue-${issue.id}`} className=" relative border-b border-b-custom-border-200 w-full cursor-pointer">
      <Row
        ref={issueRef}
        className={cn(
          "group/list-block min-h-11 relative flex flex-col gap-3 bg-custom-background-100 hover:bg-custom-background-90 py-3 text-sm transition-colors border border-transparent last:border-b-transparent",
          {
            "md:flex-row md:items-center": isSidebarCollapsed,
            "lg:flex-row lg:items-center": !isSidebarCollapsed,
          }
        )}
      >
        <div className="flex w-full truncate">
          <div className="flex flex-grow items-center gap-0.5 truncate">
            <div className="flex items-center gap-1">
              {/* {displayProperties && (displayProperties.key || displayProperties.issue_type) && ( */}
              <div className="flex-shrink-0">
                {issue.project_id && (
                  <div className="flex items-center space-x-2">
                    <IdentifierText
                      identifier={projectIdentifier}
                      enableClickToCopyIdentifier
                      textContainerClassName="text-xs font-medium text-custom-text-300"
                    />
                  </div>
                )}
              </div>
              {/* )} */}

              {/* sub-issues chevron */}
              <div className="size-4 grid place-items-center flex-shrink-0" />
            </div>

            <Tooltip
              tooltipContent={issue.name}
              // isMobile={isMobile}
              position="top-left"
              // disabled={isCurrentBlockDragging}
              renderByDefault={false}
            >
              <p className="w-full truncate cursor-pointer text-sm text-custom-text-100">{issue.name}</p>
            </Tooltip>
          </div>

          {/* quick actions */}
          <div
            className={cn("block border border-custom-border-300 rounded", {
              "md:hidden": isSidebarCollapsed,
              "lg:hidden": !isSidebarCollapsed,
            })}
          >
            <WorkspaceDraftIssueQuickActions
              parentRef={issueRef}
              issue={issue}
              handleUpdate={async (data) => updateIssue(workspaceSlug, issueId, data)}
              handleDelete={async () => deleteIssue(workspaceSlug, issueId)}
              handleMoveToIssues={async () => moveIssue(workspaceSlug, issueId, issue)}
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <DraftIssueProperties
            className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-grow md:flex-shrink-0" : "lg:flex-grow lg:flex-shrink-0"} items-center gap-2 whitespace-nowrap`}
            issue={issue}
            updateIssue={async (projectId, issueId, data) => {
              await updateIssue(workspaceSlug, issueId, data);
            }}
            activeLayout="List"
          />
          <div
            className={cn("hidden", {
              "md:flex": isSidebarCollapsed,
              "lg:flex": !isSidebarCollapsed,
            })}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <WorkspaceDraftIssueQuickActions
              parentRef={issueRef}
              issue={issue}
              handleUpdate={async (data) => updateIssue(workspaceSlug, issueId, data)}
              handleDelete={async () => deleteIssue(workspaceSlug, issueId)}
              handleMoveToIssues={async () => moveIssue(workspaceSlug, issueId, issue)}
            />
          </div>
        </div>
      </Row>
    </div>
  );
});
