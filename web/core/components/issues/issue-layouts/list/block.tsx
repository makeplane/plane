"use client";

import { Dispatch, MouseEvent, SetStateAction, useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
// types
import { TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
// ui
import { Spinner, Tooltip, ControlLink, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { MultipleSelectEntityAction } from "@/components/core";
import { IssueProperties } from "@/components/issues/issue-layouts/properties";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { TRenderQuickActions } from "./list-view-types";

interface IssueBlockProps {
  issueId: string;
  issuesMap: TIssueMap;
  groupId: string;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
  nestingLevel: number;
  spacingLeft?: number;
  isExpanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  selectionHelpers: TSelectionHelper;
  isCurrentBlockDragging: boolean;
  setIsCurrentBlockDragging: React.Dispatch<React.SetStateAction<boolean>>;
  canDrag: boolean;
}

export const IssueBlock = observer((props: IssueBlockProps) => {
  const {
    issuesMap,
    issueId,
    groupId,
    updateIssue,
    quickActions,
    displayProperties,
    canEditProperties,
    nestingLevel,
    spacingLeft = 14,
    isExpanded,
    setExpanded,
    selectionHelpers,
    isCurrentBlockDragging,
    setIsCurrentBlockDragging,
    canDrag,
  } = props;
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  // hooks
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, peekIssue, setPeekIssue, subIssues: subIssuesStore } = useIssueDetail();

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    !getIsIssuePeeked(issue.id) &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id, nestingLevel: nestingLevel });

  const issue = issuesMap[issueId];
  const subIssuesCount = issue?.sub_issues_count ?? 0;

  const { isMobile } = usePlatformOS();

  useEffect(() => {
    const element = issueRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => canDrag,
        getInitialData: () => ({ id: issueId, type: "ISSUE", groupId }),
        onDragStart: () => {
          setIsCurrentBlockDragging(true);
        },
        onDrop: () => {
          setIsCurrentBlockDragging(false);
        },
      })
    );
  }, [canDrag, issueId, groupId, setIsCurrentBlockDragging]);

  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id ?? undefined);
  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  const isIssueSelected = selectionHelpers.getIsEntitySelected(issue.id);
  const isIssueActive = selectionHelpers.getIsEntityActive(issue.id);
  const isSubIssue = nestingLevel !== 0;
  const canSelectIssues = canEditIssueProperties && !selectionHelpers.isSelectionDisabled;

  const marginLeft = `${spacingLeft}px`;

  const handleToggleExpand = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (nestingLevel >= 3) {
      handleIssuePeekOverview(issue);
    } else {
      setExpanded((prevState) => {
        if (!prevState && workspaceSlug && issue && issue.project_id)
          subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issue.project_id, issue.id);
        return !prevState;
      });
    }
  };

  //TODO: add better logic. This is to have a min width for ID/Key based on the length of project identifier
  const keyMinWidth = ((projectIdentifier?.length ?? 0) + 5) * 7;

  return (
    <div
      ref={issueRef}
      className={cn(
        "group/list-block min-h-11 relative flex flex-col md:flex-row md:items-center gap-3 bg-custom-background-100 hover:bg-custom-background-90 p-3 pl-1.5 text-sm transition-colors border border-transparent",
        {
          "border-custom-primary-70": getIsIssuePeeked(issue.id) && peekIssue?.nestingLevel === nestingLevel,
          "border-custom-border-400": isIssueActive,
          "last:border-b-transparent": !getIsIssuePeeked(issue.id) && !isIssueActive,
          "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isIssueSelected,
          "bg-custom-background-80": isCurrentBlockDragging,
        }
      )}
      onDragStart={() => {
        if (!canDrag) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: "Cannot move issue",
            message: "Drag and drop is disabled for the current grouping",
          });
        }
      }}
    >
      <div className="flex w-full truncate">
        <div className="flex flex-grow items-center gap-0.5 truncate">
          <div className="flex items-center gap-1" style={isSubIssue ? { marginLeft } : {}}>
            {/* select checkbox */}
            {projectId && canSelectIssues && (
              <Tooltip
                tooltipContent={
                  <>
                    Only issues within the current
                    <br />
                    project can be selected.
                  </>
                }
                disabled={issue.project_id === projectId}
              >
                <div className="flex-shrink-0 grid place-items-center w-3.5">
                  <MultipleSelectEntityAction
                    className={cn(
                      "opacity-0 pointer-events-none group-hover/list-block:opacity-100 group-hover/list-block:pointer-events-auto transition-opacity",
                      {
                        "opacity-100 pointer-events-auto": isIssueSelected,
                      }
                    )}
                    groupId={groupId}
                    id={issue.id}
                    selectionHelpers={selectionHelpers}
                    disabled={issue.project_id !== projectId}
                  />
                </div>
              </Tooltip>
            )}
            {displayProperties && displayProperties?.key && (
              <div
                className="flex-shrink-0 text-xs font-medium text-custom-text-300 pl-2"
                style={{ minWidth: `${keyMinWidth}px` }}
              >
                {projectIdentifier}-{issue.sequence_id}
              </div>
            )}

            {/* sub-issues chevron */}
            <div className="size-4 grid place-items-center flex-shrink-0">
              {subIssuesCount > 0 && (
                <button
                  type="button"
                  className="size-4 grid place-items-center rounded-sm text-custom-text-400 hover:text-custom-text-300"
                  onClick={handleToggleExpand}
                >
                  <ChevronRight
                    className={cn("size-4", {
                      "rotate-90": isExpanded,
                    })}
                    strokeWidth={2.5}
                  />
                </button>
              )}
            </div>

            {issue?.tempId !== undefined && (
              <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
            )}
          </div>

          {issue?.is_draft ? (
            <Tooltip
              tooltipContent={issue.name}
              isMobile={isMobile}
              position="top-left"
              disabled={isCurrentBlockDragging}
            >
              <p className="truncate">{issue.name}</p>
            </Tooltip>
          ) : (
            <ControlLink
              id={`issue-${issue.id}`}
              href={`/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}issues/${
                issue.id
                }`}
              onClick={() => handleIssuePeekOverview(issue)}
              className="w-full truncate cursor-pointer text-sm text-custom-text-100"
              disabled={!!issue?.tempId}
            >
              <Tooltip tooltipContent={issue.name} isMobile={isMobile} position="top-left">
                <p className="truncate">{issue.name}</p>
              </Tooltip>
            </ControlLink>
          )}
        </div>
        {!issue?.tempId && (
          <div className="block md:hidden border border-custom-border-300 rounded">
            {quickActions({
              issue,
              parentRef: issueRef,
            })}
          </div>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {!issue?.tempId ? (
          <>
            <IssueProperties
              className="relative flex flex-wrap md:flex-grow md:flex-shrink-0 items-center gap-2 whitespace-nowrap"
              issue={issue}
              isReadOnly={!canEditIssueProperties}
              updateIssue={updateIssue}
              displayProperties={displayProperties}
              activeLayout="List"
            />
            <div className="hidden md:block">
              {quickActions({
                issue,
                parentRef: issueRef,
              })}
            </div>
          </>
        ) : (
          <div className="h-4 w-4">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
});
