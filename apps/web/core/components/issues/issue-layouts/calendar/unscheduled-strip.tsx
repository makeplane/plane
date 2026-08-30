/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ListFilter, PanelRightClose, Search, X } from "lucide-react";
import { observer } from "mobx-react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { PriorityIcon } from "@plane/propel/icons";
import type { TGroupedIssues, TIssueMap, TIssuePriorities, TPaginationData } from "@plane/types";
import { cn } from "@plane/utils";
import { highlightIssueOnDrop } from "@/components/issues/issue-layouts/utils";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlocks } from "./issue-blocks";
import {
  CALENDAR_DAY_DROP_TYPE,
  CALENDAR_ISSUE_DRAG_TYPE,
  getCalendarDestinationFromDropPayload,
  getCalendarSourceFromDropPayload,
} from "./utils";

type TUnscheduledSortKey = "manual" | "priority" | "title" | "created_at";
type TSortOrder = "asc" | "desc";

const PRIORITY_RANK: Record<TIssuePriorities, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

const SORT_OPTIONS: { key: TUnscheduledSortKey; label: string }[] = [
  { key: "manual", label: "Manual" },
  { key: "priority", label: "Priority" },
  { key: "title", label: "Title" },
  { key: "created_at", label: "Created date" },
];

type Props = {
  groupedIssueIds: TGroupedIssues;
  issues?: TIssueMap;
  quickActions: TRenderQuickActions;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  readOnly?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  variant?: "strip" | "sidebar";
  className?: string;
  onCollapse?: () => void;
  handleDragAndDrop: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined,
    destinationHour?: number
  ) => Promise<void>;
};

export const CalendarUnscheduledStrip = observer(function CalendarUnscheduledStrip(props: Props) {
  const {
    groupedIssueIds,
    issues,
    quickActions,
    loadMoreIssues,
    getPaginationData,
    getGroupIssueCount,
    readOnly,
    canEditProperties,
    isEpic,
    variant = "strip",
    className,
    onCollapse,
    handleDragAndDrop,
  } = props;
  const { t } = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCalendarDragActive, setIsCalendarDragActive] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const issueIds = groupedIssueIds?.None;
  // Keep an editable empty shell so scheduled issues can be dropped back to unscheduled.
  const shouldRender = Boolean(issueIds?.length) || !readOnly;
  const isSidebar = variant === "sidebar";

  // Local sort & filter — scoped to the unscheduled sidebar only, independent of the
  // calendar's global filters/order-by so it doesn't affect the scheduled days.
  const [sortKey, setSortKey] = useState<TUnscheduledSortKey>("manual");
  const [sortOrder, setSortOrder] = useState<TSortOrder>("asc");
  const [priorityFilter, setPriorityFilter] = useState<Set<TIssuePriorities>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  useOutsideClickDetector(sortMenuRef, () => setIsSortOpen(false));
  useOutsideClickDetector(filterMenuRef, () => setIsFilterOpen(false));

  const togglePriorityFilter = (priority: TIssuePriorities) => {
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(priority)) next.delete(priority);
      else next.add(priority);
      return next;
    });
  };

  const visibleIssueIds = useMemo(() => {
    let ids = issueIds ?? [];

    const trimmedSearch = searchText.trim().toLowerCase();
    if (trimmedSearch) {
      ids = ids.filter((id) => (issues?.[id]?.name ?? "").toLowerCase().includes(trimmedSearch));
    }

    if (priorityFilter.size > 0) {
      ids = ids.filter((id) => priorityFilter.has((issues?.[id]?.priority as TIssuePriorities) ?? "none"));
    }

    if (sortKey !== "manual") {
      ids = [...ids].toSorted((a, b) => {
        const issueA = issues?.[a];
        const issueB = issues?.[b];
        let result = 0;
        if (sortKey === "priority") {
          result =
            PRIORITY_RANK[(issueA?.priority as TIssuePriorities) ?? "none"] -
            PRIORITY_RANK[(issueB?.priority as TIssuePriorities) ?? "none"];
        } else if (sortKey === "title") {
          result = (issueA?.name ?? "").localeCompare(issueB?.name ?? "");
        } else if (sortKey === "created_at") {
          result = new Date(issueA?.created_at ?? 0).getTime() - new Date(issueB?.created_at ?? 0).getTime();
        }
        return sortOrder === "asc" ? result : -result;
      });
    }

    return ids;
  }, [issueIds, issues, searchText, priorityFilter, sortKey, sortOrder]);

  useEffect(() => {
    if (!shouldRender || readOnly) return;

    return monitorForElements({
      onDragStart: ({ source }) => {
        if (source.data.type === CALENDAR_ISSUE_DRAG_TYPE) setIsCalendarDragActive(true);
      },
      onDrop: () => setIsCalendarDragActive(false),
    });
  }, [readOnly, shouldRender]);

  const stripDropZoneClassName = cn("rounded-sm border border-dashed border-subtle-1 p-2", {
    "bg-layer-transparent-hover ring-2 ring-accent-strong": isDraggingOver,
    "bg-layer-transparent-hover": isCalendarDragActive && !isDraggingOver,
    "min-h-10": !issueIds?.length,
  });

  const dropHint =
    isCalendarDragActive && !isDraggingOver ? (
      <p className="mb-2 text-center text-11 text-tertiary">{t("issue.layouts.calendar.drop_to_unschedule")}</p>
    ) : null;

  useEffect(() => {
    if (!shouldRender) return;

    const element = stripRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source?.data?.type === CALENDAR_ISSUE_DRAG_TYPE,
        getData: () => ({ date: "None", type: CALENDAR_DAY_DROP_TYPE }),
        onDragEnter: () => setIsDraggingOver(true),
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: (payload) => {
          setIsDraggingOver(false);

          const source = getCalendarSourceFromDropPayload(payload);
          const destination = getCalendarDestinationFromDropPayload(payload);
          if (!source || !destination) return;

          void handleDragAndDrop(
            source.id,
            issues?.[source.id]?.project_id ?? undefined,
            source.date,
            destination.date
          );

          highlightIssueOnDrop(payload.source?.element?.id, false);
        },
      })
    );
  }, [handleDragAndDrop, issueIds?.length, issues, readOnly, shouldRender]);

  if (!shouldRender) return null;

  const issueBlocks = (
    <CalendarIssueBlocks
      issueIdList={visibleIssueIds}
      quickActions={quickActions}
      loadMoreIssues={() => loadMoreIssues("None")}
      getPaginationData={() => getPaginationData("None")}
      getGroupIssueCount={() => getGroupIssueCount("None")}
      isDragDisabled={readOnly}
      readOnly={readOnly}
      canEditProperties={canEditProperties}
      isEpic={isEpic}
      sourceDate="None"
      showProjectBadge
      stackProjectBadge
      enableInfiniteScroll
      scrollContainerRef={scrollContainerRef}
    />
  );

  const activeSortLabel = SORT_OPTIONS.find((option) => option.key === sortKey)?.label;

  const searchBar = (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-subtle-1 px-2 py-1.5">
      <Search className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" />
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search issues"
        className="w-full bg-transparent text-11 text-primary placeholder:text-tertiary focus:outline-none"
      />
      {searchText && (
        <button
          type="button"
          className="flex-shrink-0 rounded-sm p-0.5 text-tertiary hover:bg-layer-1 hover:text-primary"
          onClick={() => setSearchText("")}
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  const sortAndFilterToolbar = (
    <div className="flex shrink-0 items-center gap-1 border-b border-subtle-1 px-2 py-1.5">
      <div ref={sortMenuRef} className="relative">
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded-sm px-1.5 py-1 text-11 font-medium text-secondary hover:bg-layer-1 hover:text-primary",
            { "bg-layer-1 text-primary": isSortOpen || sortKey !== "manual" }
          )}
          onClick={() => {
            setIsSortOpen((prev) => !prev);
            setIsFilterOpen(false);
          }}
        >
          {sortOrder === "asc" ? (
            <ArrowUpNarrowWide className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
          )}
          {activeSortLabel}
        </button>
        {isSortOpen && (
          <div className="absolute left-0 z-20 mt-1 min-w-[9rem] rounded-sm border border-subtle bg-surface-1 p-1 shadow-raised-200">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1 text-left text-11 hover:bg-layer-1",
                  { "text-accent-primary": sortKey === option.key }
                )}
                onClick={() => {
                  setSortKey(option.key);
                  setIsSortOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
            {sortKey !== "manual" && (
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-sm border-t border-subtle-1 px-2 py-1 pt-1.5 text-left text-11 text-secondary hover:bg-layer-1"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              >
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </button>
            )}
          </div>
        )}
      </div>

      <div ref={filterMenuRef} className="relative">
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded-sm px-1.5 py-1 text-11 font-medium text-secondary hover:bg-layer-1 hover:text-primary",
            { "bg-layer-1 text-primary": isFilterOpen || priorityFilter.size > 0 }
          )}
          onClick={() => {
            setIsFilterOpen((prev) => !prev);
            setIsSortOpen(false);
          }}
        >
          <ListFilter className="h-3.5 w-3.5" />
          {priorityFilter.size > 0 ? `Priority (${priorityFilter.size})` : "Filter"}
        </button>
        {isFilterOpen && (
          <div className="absolute left-0 z-20 mt-1 min-w-[9rem] rounded-sm border border-subtle bg-surface-1 p-1 shadow-raised-200">
            {ISSUE_PRIORITIES.map((priority) => (
              <button
                key={priority.key}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-11 hover:bg-layer-1"
                onClick={() => togglePriorityFilter(priority.key)}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={priorityFilter.has(priority.key)}
                  className="pointer-events-none h-3 w-3"
                />
                <PriorityIcon priority={priority.key} size={12} />
                {priority.title}
              </button>
            ))}
            {priorityFilter.size > 0 && (
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-sm border-t border-subtle-1 px-2 py-1 pt-1.5 text-left text-11 text-secondary hover:bg-layer-1"
                onClick={() => setPriorityFilter(new Set())}
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isSidebar) {
    return (
      <div className={cn("flex h-full w-64 shrink-0 flex-col border-l border-subtle-1 bg-surface-1", className)}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle-1 px-3 py-2">
          <p className="text-11 font-medium text-tertiary">{t("issue.layouts.calendar.unscheduled")}</p>
          {onCollapse && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={PanelRightClose}
              onClick={onCollapse}
              aria-label="Hide unscheduled sidebar"
            />
          )}
        </div>
        {searchBar}
        {sortAndFilterToolbar}
        <div ref={scrollContainerRef} className="vertical-scrollbar scrollbar-sm min-h-0 flex-1 overflow-y-auto p-2">
          <div ref={stripRef} className={cn("min-h-full", stripDropZoneClassName)}>
            {dropHint}
            {issueBlocks}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-t border-subtle-1 px-4 py-3", className)}>
      <p className="mb-2 text-11 font-medium text-tertiary">{t("issue.layouts.calendar.unscheduled")}</p>
      <div ref={scrollContainerRef} className="vertical-scrollbar scrollbar-sm max-h-48 overflow-y-auto">
        <div ref={stripRef} className={stripDropZoneClassName}>
          {dropHint}
          {issueBlocks}
        </div>
      </div>
    </div>
  );
});
