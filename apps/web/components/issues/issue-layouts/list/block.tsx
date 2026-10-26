/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AddOutline, ChevronRightOutline, EditOutline } from "@makeplane/propel/icons";
// types
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import type { TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { ControlLink, Row } from "@plane/blocks/layout";
import { Spinner } from "@plane/blocks/spinner";
import { cn, generateWorkItemLink } from "@plane/utils";
// components
import { MultipleSelectEntityAction } from "@/components/core/multiple-select";
import { LabelSelect } from "@/components/dropdowns/label/label-select";
import { IssueProperties } from "@/components/issues/issue-layouts/properties";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
import type { TRenderQuickActions } from "./list-view-types";

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
  // d2m-plane: open the inline "add sub-work item" row under this item
  onQuickAddSubIssue?: () => void;
  // d2m-plane: another work item is being dragged over the middle of this row (drop = make it a child)
  isChildDropTarget?: boolean;
}

export const IssueBlock = observer(function IssueBlock(props: IssueBlockProps) {
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
    onQuickAddSubIssue,
    isChildDropTarget = false,
  } = props;
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // d2m-plane: hover quick actions (add sub-work item, edit labels, rename)
  const { t } = useTranslation();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isLabelSelectOpen, setIsLabelSelectOpen] = useState(false);
  const renameHandledRef = useRef(false);
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
  const isDraggingAllowed = canDrag && canEditIssueProperties && !isRenaming;

  const { isMobile } = usePlatformOS();

  useEffect(() => {
    const element = issueRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => isDraggingAllowed,
        // d2m-plane: isSubIssue / parentId let drop targets re-parent (make child / move to top level)
        getInitialData: () => ({
          id: issueId,
          type: "ISSUE",
          groupId,
          isSubIssue: nestingLevel !== 0,
          parentId: issuesMap[issueId]?.parent_id ?? null,
        }),
        onDragStart: () => {
          setIsCurrentBlockDragging(true);
        },
        onDrop: () => {
          setIsCurrentBlockDragging(false);
        },
      })
    );
  }, [isDraggingAllowed, issueId, groupId, nestingLevel, issuesMap, setIsCurrentBlockDragging]);

  if (!issue) return null;

  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  const isIssueSelected = selectionHelpers.getIsEntitySelected(issue.id);
  const isIssueActive = selectionHelpers.getIsEntityActive(issue.id);
  const isSubIssue = nestingLevel !== 0;
  const canSelectIssues = canEditIssueProperties && !selectionHelpers.isSelectionDisabled;

  const marginLeft = `${spacingLeft}px`;

  // d2m-plane: hover quick actions
  const canQuickEdit = canEditIssueProperties && !isEpic && !issue.tempId && !issue.archived_at && !!updateIssue;
  const stopRowClick = (e: React.SyntheticEvent) => {
    // the row is a link that opens the peek overview — keep quick actions from triggering it
    e.stopPropagation();
    e.preventDefault();
  };
  const submitRename = async (value: string) => {
    if (renameHandledRef.current) return;
    renameHandledRef.current = true;
    setIsRenaming(false);
    const newName = value.trim();
    if (!newName || newName === issue.name || !updateIssue) return;
    try {
      await updateIssue(issue.project_id, issue.id, { name: newName });
    } catch {
      setToast({ type: "error", title: "Error!", message: t("d2m_quick_actions.rename_failed") });
    }
  };

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
          "group/list-block relative flex min-h-11 flex-col gap-3 bg-layer-transparent py-3 text-13 transition-colors hover:bg-layer-transparent-hover",
          {
            "border-accent-strong": getIsIssuePeeked(issue.id) && peekIssue?.nestingLevel === nestingLevel,
            "border-strong-1": isIssueActive,
            "last:border-b-transparent": !getIsIssuePeeked(issue.id) && !isIssueActive,
            "bg-accent-primary/5 hover:bg-accent-primary/10": isIssueSelected,
            "bg-layer-1": isCurrentBlockDragging,
            "bg-accent-primary/10 ring-2 ring-inset ring-accent-strong": isChildDropTarget,
            "md:flex-row md:items-center": isSidebarCollapsed,
            "lg:flex-row lg:items-center": !isSidebarCollapsed,
          }
        )}
        onDragStart={() => {
          if (!isDraggingAllowed) {
            setToast({
              type: "warning",
              title: "Cannot move work item",
              message: !canEditIssueProperties
                ? "You are not allowed to move this work item"
                : "Drag and drop is disabled for the current grouping",
            });
          }
        }}
      >
        <div className="flex w-full gap-2 truncate">
          <div className="flex flex-grow items-center gap-0.5 truncate">
            <div className="flex items-center gap-1" style={isSubIssue ? { marginLeft } : {}}>
              {/* select checkbox */}
              {projectId && canSelectIssues && !isEpic && (
                <Tooltip
                  label="Only work items within the current project can be selected."
                  layout="stacked"
                  disabled={issue.project_id === projectId}
                >
                  {/* d2m-plane: clicks around the checkbox must not open the peek overview */}
                  {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
                  <div
                    className="absolute left-1 grid w-3.5 flex-shrink-0 place-items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <MultipleSelectEntityAction
                      className={cn(
                        "pointer-events-none opacity-0 transition-opacity group-hover/list-block:pointer-events-auto group-hover/list-block:opacity-100",
                        {
                          "pointer-events-auto opacity-100": isIssueSelected,
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
              {/* d2m-plane: work item identifier (e.g. 1-184) is intentionally not shown in the list layout */}

              {/* sub-issues chevron (d2m-plane: larger 28px hit area) */}
              <div className="-my-1.5 grid size-7 flex-shrink-0 place-items-center">
                {subIssuesCount > 0 && !isEpic && (
                  <button
                    type="button"
                    aria-label={isExpanded ? "Collapse sub-work items" : "Expand sub-work items"}
                    aria-expanded={isExpanded}
                    className="grid size-7 place-items-center rounded-sm text-placeholder transition-colors hover:bg-layer-transparent-hover hover:text-tertiary"
                    onClick={handleToggleExpand}
                  >
                    <ChevronRightOutline
                      className={cn("size-4", {
                        "rotate-90": isExpanded,
                      })}
                    />
                  </button>
                )}
              </div>

              {issue?.tempId !== undefined && (
                <div className="absolute top-0 left-0 z-[99999] h-full w-full animate-pulse bg-surface-1/20" />
              )}
            </div>

            {isRenaming ? (
              <input
                // oxlint-disable-next-line jsx_a11y/no-autofocus
                autoFocus
                type="text"
                defaultValue={issue.name}
                aria-label={t("d2m_quick_actions.rename")}
                className="w-full min-w-0 rounded-sm border border-strong bg-surface-1 px-1.5 py-0.5 text-body-xs-medium text-primary outline-none"
                onClick={stopRowClick}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitRename(e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    renameHandledRef.current = true;
                    setIsRenaming(false);
                  }
                }}
                onBlur={(e) => void submitRename(e.currentTarget.value)}
              />
            ) : (
              <Tooltip label={issue.name} layout="stacked" align="start" disabled={isCurrentBlockDragging || isMobile}>
                <p className="cursor-pointer truncate text-body-xs-medium text-primary">{issue.name}</p>
              </Tooltip>
            )}

            {/* d2m-plane: number of sub-work items next to the name */}
            {!isRenaming && !isEpic && subIssuesCount > 0 && (
              <Tooltip label={`${subIssuesCount} ${t("common.sub_work_items")}`} disabled={isMobile}>
                <span className="ml-1.5 flex-shrink-0 rounded-sm bg-layer-3 px-1 text-caption-sm-medium text-tertiary">
                  {subIssuesCount}
                </span>
              </Tooltip>
            )}

            {/* d2m-plane: hint while another work item hovers this row */}
            {isChildDropTarget && (
              <span className="pointer-events-none ml-2 flex-shrink-0 rounded-sm bg-accent-primary px-1.5 py-0.5 text-caption-sm-medium text-on-color">
                {t("d2m_quick_actions.drop_to_make_child")}
              </span>
            )}

            {/* d2m-plane: hover quick actions */}
            {canQuickEdit && !isRenaming && (
              // oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions
              <div
                className={cn(
                  "ml-1.5 flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/list-block:opacity-100 focus-within:opacity-100",
                  { "opacity-100": isLabelSelectOpen }
                )}
                onClick={stopRowClick}
                onFocus={(e) => e.stopPropagation()}
              >
                {onQuickAddSubIssue && nestingLevel < 3 && (
                  <Tooltip label={t("d2m_quick_actions.add_sub_issue")} disabled={isMobile}>
                    <button
                      type="button"
                      aria-label={t("d2m_quick_actions.add_sub_issue")}
                      className="grid size-6 place-items-center rounded-sm text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
                      onClick={(e) => {
                        stopRowClick(e);
                        onQuickAddSubIssue();
                      }}
                    >
                      <AddOutline className="size-3.5" />
                    </button>
                  </Tooltip>
                )}
                {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
                <div onClick={() => setIsLabelSelectOpen(true)}>
                  <LabelSelect
                    projectId={issue.project_id}
                    value={issue.label_ids ?? []}
                    onChange={(labelIds) => void updateIssue?.(issue.project_id, issue.id, { label_ids: labelIds })}
                    onClose={() => setIsLabelSelectOpen(false)}
                    variant="icon-md"
                    tooltip={{ heading: t("d2m_quick_actions.edit_labels") }}
                  />
                </div>
                <Tooltip label={t("d2m_quick_actions.rename")} disabled={isMobile}>
                  <button
                    type="button"
                    aria-label={t("d2m_quick_actions.rename")}
                    className="grid size-6 place-items-center rounded-sm text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
                    onClick={(e) => {
                      stopRowClick(e);
                      renameHandledRef.current = false;
                      setIsRenaming(true);
                    }}
                  >
                    <EditOutline className="size-3.5" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
          {!issue?.tempId && (
            <div
              className={cn("block rounded-sm border border-strong", {
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
                className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-shrink-0 md:flex-grow" : "lg:flex-shrink-0 lg:flex-grow"} items-center gap-2 whitespace-nowrap`}
                issue={issue}
                isReadOnly={!canEditIssueProperties}
                updateIssue={updateIssue}
                displayProperties={displayProperties}
                activeLayout="List"
                isEpic={isEpic}
              />
              {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
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
