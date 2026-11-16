/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useRef, useState } from "react";
import { omit } from "lodash-es";
import { observer } from "mobx-react";
import { CopyOutline, DeleteOutline, EditOutline, SquareStackOutline } from "@makeplane/propel/icons";
// plane utils
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TWorkspaceDraftIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import type { TContextMenuItem } from "@plane/blocks/context-menu";
import { Row } from "@plane/blocks/layout";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
import { useListRowPropertiesBudget } from "@/hooks/use-list-row-properties-budget";
// local imports
import { IdentifierText } from "../issue-detail/identifier-text";
import { CreateUpdateIssueModal } from "../issue-modal/modal";
import { WorkspaceDraftIssueDeleteIssueModal } from "./delete-modal";
import { DraftIssueProperties } from "./draft-issue-properties";
import { WorkspaceDraftIssueQuickActions } from "./quick-action";

type Props = {
  workspaceSlug: string;
  issueId: string;
};

export const DraftIssueBlock = observer(function DraftIssueBlock(props: Props) {
  // props
  const { workspaceSlug, issueId } = props;
  // states
  const [moveToIssue, setMoveToIssue] = useState(false);
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TWorkspaceDraftIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // hooks
  const { getIssueById, updateIssue, deleteIssue } = useWorkspaceDraftIssues();
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { getProjectIdentifierById } = useProject();
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // derived values
  const issue = getIssueById(issueId);
  const projectIdentifier = (issue && issue.project_id && getProjectIdentifierById(issue.project_id)) || undefined;
  // Room for the property chips while the row is single-line (`md:flex-row` / `lg:flex-row` below).
  const { rowRef, leadingRef, quickActionsRef, budgetPx } = useListRowPropertiesBudget({
    enabled: !!issue && !!projectIdentifier,
    singleLineFrom: isSidebarCollapsed ? "md" : "lg",
  });
  if (!issue || !projectIdentifier) return null;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      is_draft: true,
    },
    ["id"]
  );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "edit",
      icon: EditOutline,
      action: () => {
        setIssueToEdit(issue);
        setCreateUpdateIssueModal(true);
      },
    },
    {
      key: "make-a-copy",
      title: "make_a_copy",
      icon: CopyOutline,
      action: () => {
        setCreateUpdateIssueModal(true);
      },
    },
    {
      key: "move-to-issues",
      title: "move_to_project",
      icon: SquareStackOutline,
      action: () => {
        setMoveToIssue(true);
        setIssueToEdit(issue);
        setCreateUpdateIssueModal(true);
      },
    },
    {
      key: "delete",
      title: "delete",
      icon: DeleteOutline,
      action: () => {
        setDeleteIssueModal(true);
      },
    },
  ];

  return (
    <>
      <WorkspaceDraftIssueDeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={async () => deleteIssue(workspaceSlug, issueId)}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
          setMoveToIssue(false);
        }}
        data={issueToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (issueToEdit) await updateIssue(workspaceSlug, issueId, data);
        }}
        storeType={EIssuesStoreType.WORKSPACE_DRAFT}
        fetchIssueDetails={false}
        moveToIssue={moveToIssue}
        isDraft
      />
      <div
        id={`issue-${issue.id}`}
        className="relative w-full cursor-pointer border-b border-b-subtle-1"
        onDoubleClick={() => {
          setIssueToEdit(issue);
          setCreateUpdateIssueModal(true);
        }}
      >
        <Row
          ref={(node: HTMLDivElement | null) => {
            issueRef.current = node;
            rowRef(node);
          }}
          className={cn(
            "group/list-block relative flex min-h-11 flex-col gap-3 bg-layer-transparent py-3 text-body-xs-regular transition-colors hover:bg-layer-transparent-hover",
            {
              "md:flex-row md:items-center": isSidebarCollapsed,
              "lg:flex-row lg:items-center": !isSidebarCollapsed,
            }
          )}
        >
          <div className="flex w-full truncate">
            <div className="flex flex-grow items-center gap-0.5 truncate">
              <div ref={leadingRef} className="flex items-center gap-1">
                <div className="flex-shrink-0">
                  {issue.project_id && (
                    <div className="flex items-center space-x-2">
                      <IdentifierText
                        identifier={projectIdentifier}
                        enableClickToCopyIdentifier
                        size="xs"
                        variant="tertiary"
                      />
                    </div>
                  )}
                </div>

                {/* sub-issues chevron */}
                <div className="grid size-4 flex-shrink-0 place-items-center" />
              </div>

              <Tooltip label={issue.name} layout="stacked" align="start">
                <p className="w-full cursor-pointer truncate text-body-xs-regular text-primary">{issue.name}</p>
              </Tooltip>
            </div>

            {/* quick actions */}
            <div
              className={cn("block rounded-sm border border-strong", {
                "md:hidden": isSidebarCollapsed,
                "lg:hidden": !isSidebarCollapsed,
              })}
            >
              <WorkspaceDraftIssueQuickActions parentRef={issueRef} MENU_ITEMS={MENU_ITEMS} />
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <DraftIssueProperties
              className={`relative flex min-w-0 flex-wrap ${isSidebarCollapsed ? "md:flex-shrink-0 md:flex-grow md:flex-nowrap md:overflow-hidden" : "lg:flex-shrink-0 lg:flex-grow lg:flex-nowrap lg:overflow-hidden"} items-center gap-2 whitespace-nowrap`}
              issue={issue}
              overflowBudgetPx={budgetPx}
              updateIssue={async (projectId, issueId, data) => {
                await updateIssue(workspaceSlug, issueId, data);
              }}
            />
            <div
              ref={quickActionsRef}
              className={cn("hidden", {
                "md:flex": isSidebarCollapsed,
                "lg:flex": !isSidebarCollapsed,
              })}
              role="presentation"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <WorkspaceDraftIssueQuickActions parentRef={issueRef} MENU_ITEMS={MENU_ITEMS} />
            </div>
          </div>
        </Row>
      </div>
    </>
  );
});
