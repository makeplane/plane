/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { SPREADSHEET_SELECT_GROUP, SPREADSHEET_PROPERTY_LIST } from "@plane/constants";
// types
import type { TIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssueLayoutTypes, EIssueServiceType } from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// components
import { MultipleSelectGroup } from "@/components/core/multiple-select";
import { IssueBulkOperationsRoot } from "@/components/issues/bulk-operations";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { useProject } from "@/hooks/store/use-project";
import { useBulkOperationStatus } from "@/hooks/use-bulk-operation-status";
import { useIssueLayoutKeyboardNav } from "@/hooks/use-issue-layout-keyboard-nav";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// local imports
import type { TRenderQuickActions } from "../list/list-view-types";
import { QuickAddIssueRoot, SpreadsheetAddIssueButton } from "../quick-add";
import { SpreadsheetTable } from "./spreadsheet-table";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issueIds: string[] | undefined;
  quickActions: TRenderQuickActions;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  openIssuesListModal?: (() => void) | null;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  canEditProperties: (projectId: string | undefined) => boolean;
  canLoadMoreIssues: boolean;
  loadMoreIssues: () => void;
  enableQuickCreateIssue?: boolean;
  disableIssueCreation?: boolean;
  isWorkspaceLevel?: boolean;
  isEpic?: boolean;
};

type TSpreadsheetKeyboardNavBridgeProps = {
  issueIds: string[];
  containerRef: React.MutableRefObject<HTMLTableElement | null>;
  openEntity: (entity: { entityID: string }) => void;
  openInNewTab: (entity: { entityID: string }) => void;
  selectionHelpers: TSelectionHelper;
};

/**
 * @description Registers the spreadsheet layout with the keyboard-nav store.
 * A component rather than an inline call because the select-group hands its
 * selection helpers to a render prop, where hooks cannot run.
 */
const SpreadsheetKeyboardNavBridge = observer(function SpreadsheetKeyboardNavBridge(
  props: TSpreadsheetKeyboardNavBridgeProps
) {
  const { issueIds, containerRef, openEntity, openInNewTab, selectionHelpers } = props;
  useIssueLayoutKeyboardNav({
    entities: issueIds.map((id) => ({ entityID: id, groupID: SPREADSHEET_SELECT_GROUP })),
    containerRef: containerRef as React.MutableRefObject<HTMLElement | null>,
    openEntity,
    openInNewTab,
    selectionHelpers,
  });
  return null;
});

export const SpreadsheetView = observer(function SpreadsheetView(props: Props) {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    issueIds,
    quickActions,
    updateIssue,
    quickAddCallback,
    canEditProperties,
    enableQuickCreateIssue,
    disableIssueCreation,
    canLoadMoreIssues,
    loadMoreIssues,
    isWorkspaceLevel = false,
    isEpic = false,
  } = props;
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const { currentProjectDetails, getProjectIdentifierById } = useProject();
  // the peek builder reads issue records, so it must use the same store as the
  // layout (project/team/workspace/epic) - the default store is a different map
  const { issueMap } = useIssuesStore();
  const { setPeekIssue } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();

  // keyboard navigation for the rendered rows (shared single-key commands drive the cursor)
  const buildPeekIssue = (issueId: string) => {
    const issue = issueMap[issueId];
    if (!workspaceSlug || !issue?.project_id) return;
    setPeekIssue({
      workspaceSlug: workspaceSlug.toString(),
      projectId: issue.project_id,
      issueId: issue.id,
      nestingLevel: 0,
      isArchived: !!issue.archived_at,
    });
  };

  // `ctrl/cmd + enter`: the work item's own URL in a browser tab
  const openIssueInNewTab = (issueId: string) => {
    const issue = issueMap[issueId];
    const projectIdentifier = issue?.project_id ? getProjectIdentifierById(issue.project_id) : undefined;
    if (!workspaceSlug || !issue?.project_id || !projectIdentifier) return;
    window.open(
      window.location.origin +
        generateWorkItemLink({
          workspaceSlug: workspaceSlug.toString(),
          projectId: issue.project_id,
          issueId: issue.id,
          projectIdentifier,
          sequenceId: issue.sequence_id,
          isArchived: !!issue.archived_at,
          isEpic,
        }),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const isEstimateEnabled: boolean = currentProjectDetails?.estimate !== null;

  const spreadsheetColumnsList = isWorkspaceLevel
    ? SPREADSHEET_PROPERTY_LIST
    : SPREADSHEET_PROPERTY_LIST.filter((property) => {
        if (property === "cycle" && !currentProjectDetails?.cycle_view) return false;
        if (property === "modules" && !currentProjectDetails?.module_view) return false;
        return true;
      });

  if (!issueIds || issueIds.length === 0) return <></>;
  return (
    <div className="relative flex h-full w-full flex-col overflow-x-hidden bg-layer-1 whitespace-nowrap text-secondary">
      <div ref={portalRef} className="spreadsheet-menu-portal" />
      <MultipleSelectGroup
        containerRef={containerRef}
        entities={{
          [SPREADSHEET_SELECT_GROUP]: issueIds,
        }}
        disabled={!isBulkOperationsEnabled || isEpic}
      >
        {(helpers) => {
          return (
            <>
              <SpreadsheetKeyboardNavBridge
                issueIds={issueIds}
                containerRef={containerRef}
                openEntity={(entity) => buildPeekIssue(entity.entityID)}
                openInNewTab={(entity) => openIssueInNewTab(entity.entityID)}
                selectionHelpers={helpers}
              />
              <div ref={containerRef} className="vertical-scrollbar horizontal-scrollbar scrollbar-lg h-full w-full">
                <SpreadsheetTable
                  displayProperties={displayProperties}
                  displayFilters={displayFilters}
                  handleDisplayFilterUpdate={handleDisplayFilterUpdate}
                  issueIds={issueIds}
                  isEstimateEnabled={isEstimateEnabled}
                  portalElement={portalRef}
                  quickActions={quickActions}
                  updateIssue={updateIssue}
                  canEditProperties={canEditProperties}
                  containerRef={containerRef}
                  canLoadMoreIssues={canLoadMoreIssues}
                  loadMoreIssues={loadMoreIssues}
                  spreadsheetColumnsList={spreadsheetColumnsList}
                  selectionHelpers={helpers}
                  isEpic={isEpic}
                />
              </div>
              <div className="border-t border-subtle">
                <div className="sticky bottom-0 left-0 z-5">
                  {enableQuickCreateIssue && !disableIssueCreation && (
                    <QuickAddIssueRoot
                      layout={EIssueLayoutTypes.SPREADSHEET}
                      QuickAddButton={SpreadsheetAddIssueButton}
                      quickAddCallback={quickAddCallback}
                      isEpic={isEpic}
                    />
                  )}
                </div>
              </div>
              <IssueBulkOperationsRoot selectionHelpers={helpers} />
            </>
          );
        }}
      </MultipleSelectGroup>
    </div>
  );
});
