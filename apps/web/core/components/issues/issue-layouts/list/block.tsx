"use client";

import { Dispatch, MouseEvent, SetStateAction, useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
// types
import { EIssueServiceType, TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
// ui
import { Spinner, Tooltip, ControlLink, setToast, TOAST_TYPE, Row } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// components
import { MultipleSelectEntityAction } from "@/components/core";
import { IssueProperties } from "@/components/issues/issue-layouts/properties";
// helpers
// hooks
import { useAppTheme, useIssueDetail, useProject } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
import { IssueStats } from "@/plane-web/components/issues/issue-layouts/issue-stats";
// types
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
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
  isEpic?: boolean;
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
    isEpic = false,
  } = props;
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  // hooks
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { getProjectIdentifierById } = useProject();
  const {
    getIsIssuePeeked,
    peekIssue,
    setPeekIssue,
    subIssues: subIssuesStore,
  } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    !getIsIssuePeeked(issue.id) &&
    setPeekIssue({
      workspaceSlug,
      projectId: issue.project_id,
      issueId: issue.id,
      nestingLevel: nestingLevel,
      isArchived: !!issue.archived_at,
    });

  // derived values
  const issue = issuesMap[issueId];
  const subIssuesCount = issue?.sub_issues_count ?? 0;
  const canEditIssueProperties = canEditProperties(issue?.project_id ?? undefined);
  const isDraggingAllowed = canDrag && canEditIssueProperties;

  const { isMobile } = usePlatformOS();

  useEffect(() => {
    const element = issueRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => isDraggingAllowed,
        getInitialData: () => ({ id: issueId, type: "ISSUE", groupId }),
        onDragStart: () => {
          setIsCurrentBlockDragging(true);
        },
        onDrop: () => {
          setIsCurrentBlockDragging(false);
        },
      })
    );
  }, [isDraggingAllowed, issueId, groupId, setIsCurrentBlockDragging]);

  if (!issue) return null;

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
  const keyMinWidth = displayProperties?.key ? (projectIdentifier?.length ?? 0) * 7 : 0;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
    isEpic,
    isArchived: !!issue?.archived_at,
  });
  return (
    <ControlLink
      id={`issue-${issue.id}`}
      href={workItemLink}
      onClick={() => handleIssuePeekOverview(issue)}
      className="w-full cursor-pointer"
      disabled={!!issue?.tempId || issue?.is_draft}
    >
      <Row
        ref={issueRef}
        className={cn(
          "group/list-block min-h-11 relative flex flex-col gap-3 bg-custom-background-100 hover:bg-custom-background-90 py-3 text-sm transition-colors border border-transparent",
          {
            "border-custom-primary-70": getIsIssuePeeked(issue.id) && peekIssue?.nestingLevel === nestingLevel,
            "border-custom-border-400": isIssueActive,
            "last:border-b-transparent": !getIsIssuePeeked(issue.id) && !isIssueActive,
            "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isIssueSelected,
            "bg-custom-background-80": isCurrentBlockDragging,
            "md:flex-row md:items-center": isSidebarCollapsed,
            "lg:flex-row lg:items-center": !isSidebarCollapsed,
          }
        )}
        onDragStart={() => {
          if (!isDraggingAllowed) {
            setToast({
              type: TOAST_TYPE.WARNING,
              title: "Cannot move work item",
              message: !canEditIssueProperties
                ? "You are not allowed to move this work item"
                : "Drag and drop is disabled for the current grouping",
            });
          }
        }}
      >
        <div className="flex gap-2 w-full truncate">
          <div className="flex flex-grow items-center gap-0.5 truncate">
            <div className="flex items-center gap-1" style={isSubIssue ? { marginLeft } : {}}>
              {/* select checkbox */}
              {projectId && canSelectIssues && !isEpic && (
                <Tooltip
                  tooltipContent={
                    <>
                      Only work items within the current
                      <br />
                      project can be selected.
                    </>
                  }
                  disabled={issue.project_id === projectId}
                >
                  <div className="flex-shrink-0 grid place-items-center w-3.5 absolute left-1">
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
              {displayProperties && (displayProperties.key || displayProperties.issue_type) && (
                <div className="flex-shrink-0" style={{ minWidth: `${keyMinWidth}px` }}>
                  {issue.project_id && (
                    <IssueIdentifier
                      issueId={issueId}
                      projectId={issue.project_id}
                      textContainerClassName="text-xs font-medium text-custom-text-300"
                      displayProperties={displayProperties}
                    />
                  )}
                </div>
              )}

              {/* sub-issues chevron */}
              <div className="size-4 grid place-items-center flex-shrink-0">
                {subIssuesCount > 0 && !isEpic && (
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

            <Tooltip
              tooltipContent={issue.name}
              isMobile={isMobile}
              position="top-left"
              disabled={isCurrentBlockDragging}
              renderByDefault={false}
            >
              <p className="truncate cursor-pointer text-sm text-custom-text-100">{issue.name}</p>
            </Tooltip>
            {isEpic && displayProperties && (
              <WithDisplayPropertiesHOC
                displayProperties={displayProperties}
                displayPropertyKey="sub_issue_count"
                shouldRenderProperty={(properties) => !!properties.sub_issue_count}
              >
                <IssueStats issueId={issue.id} className="ml-2 font-medium text-custom-text-350" />
              </WithDisplayPropertiesHOC>
            )}
          </div>
          {!issue?.tempId && (
            <div
              className={cn("block border border-custom-border-300 rounded", {
                "md:hidden": isSidebarCollapsed,
                "lg:hidden": !isSidebarCollapsed,
              })}
            >
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
                className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-grow md:flex-shrink-0" : "lg:flex-grow lg:flex-shrink-0"} items-center gap-2 whitespace-nowrap`}
                issue={issue}
                isReadOnly={!canEditIssueProperties}
                updateIssue={updateIssue}
                displayProperties={displayProperties}
                activeLayout="List"
                isEpic={isEpic}
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
      </Row>
    </ControlLink>
  );
});
