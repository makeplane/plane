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

/** A sub-issue is keyboard/selection-addressable up to this render depth */
const MAX_SUB_ISSUE_DEPTH = 3;

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  handleDisplayPropertiesUpdate?: (data: Partial<IIssueDisplayProperties>) => void;
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
  entities: { entityID: string; groupID: string }[];
  containerRef: React.MutableRefObject<HTMLTableElement | null>;
  openEntity: (entity: { entityID: string }) => void;
  openInNewTab: (entity: { entityID: string }) => void;
  selectionHelpers: TSelectionHelper;
};

/**
 * @description Registers the spreadsheet layout with the keyboard-nav store.
 * A component rather than an inline call because the select-group hands its
 * selection helpers to a render prop, where hooks cannot run. The navigation
 * order is computed by the parent (the visible row tree, expanded children
 * included) and shared with the selection group, so the cursor walks exactly
 * the entities `x`/Enter select.
 */
const SpreadsheetKeyboardNavBridge = observer(function SpreadsheetKeyboardNavBridge(
  props: TSpreadsheetKeyboardNavBridgeProps
) {
  const { entities, containerRef, openEntity, openInNewTab, selectionHelpers } = props;
  useIssueLayoutKeyboardNav({
    entities,
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
    handleDisplayPropertiesUpdate,
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
  // expanded sub-issue rows are shared state so the keyboard-nav order can follow
  // the visible row tree (rows receive the set; toggling replaces the old per-row state)
  const [expandedIssueIds, setExpandedIssueIds] = React.useState<Set<string>>(() => new Set());
  const handleToggleExpand = React.useCallback((issueId: string) => {
    setExpandedIssueIds((previous) => {
      const next = new Set(previous);
      if (next.has(issueId)) next.delete(issueId);
      else next.add(issueId);
      return next;
    });
  }, []);

  const portalRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const { currentProjectDetails, getProjectIdentifierById } = useProject();
  // the peek builder reads issue records, so it must use the same store as the
  // layout (project/team/workspace/epic) - the default store is a different map
  const { issueMap } = useIssuesStore();
  const { subIssues: subIssuesStore, setPeekIssue } = useIssueDetail(
    isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES
  );
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();

  // The visible row tree - top-level issues plus each expanded parent's children,
  // in render order - is the single source for BOTH the selection group and the
  // keyboard-nav order. The two must match: selection prunes any id missing from
  // its entity list (use-multiple-select), so feeding nav a wider set than
  // selection would silently drop child `x`-selection. Read inline (not memoized)
  // so newly fetched sub-issues widen both lists; the observer re-renders on that
  // MobX change and on expansion toggles.
  const visibleEntities: { entityID: string; groupID: string }[] = [];
  const walk = (ids: string[] | undefined, depth: number) => {
    (ids ?? []).forEach((id) => {
      visibleEntities.push({ entityID: id, groupID: SPREADSHEET_SELECT_GROUP });
      if (depth < MAX_SUB_ISSUE_DEPTH && expandedIssueIds.has(id)) {
        const childIds = subIssuesStore.subIssuesByIssueId(id);
        if (childIds?.length) walk(childIds, depth + 1);
      }
    });
  };
  walk(issueIds, 0);

  // Expansion lives in the view now (not per-row), so it outlives rows that leave
  // the list. Prune against the rendered tree, not just the top level: an expanded
  // id is dropped only once it is no longer rendered anywhere - a top-level that
  // was filtered/paged out (and its descendants) - so a re-added issue starts
  // collapsed as the old row state did, while expanded descendants of a parent
  // that is still visible (e.g. after loading more top-level rows or refiltering)
  // keep their expanded state.
  const renderedIds = new Set(visibleEntities.map((entity) => entity.entityID));
  React.useEffect(() => {
    setExpandedIssueIds((previous) => {
      if (previous.size === 0) return previous;
      const next = new Set([...previous].filter((id) => renderedIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
    // renderedIds is a fresh Set each render (derived from issueIds + expansion),
    // so it is intentionally not a dependency; the prune is keyed on the input that
    // actually changes the rendered top-level set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueIds]);

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
          // unique: an issue that renders both at the top level and as a child of an
          // expanded parent would otherwise appear twice and inflate the selection
          [SPREADSHEET_SELECT_GROUP]: [...renderedIds],
        }}
        disabled={!isBulkOperationsEnabled || isEpic}
      >
        {(helpers) => {
          return (
            <>
              <SpreadsheetKeyboardNavBridge
                entities={visibleEntities}
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
                  handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
                  expandedIssueIds={expandedIssueIds}
                  onToggleExpanded={handleToggleExpand}
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
