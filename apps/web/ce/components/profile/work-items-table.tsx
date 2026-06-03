"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Check, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TBaseIssue } from "@plane/types";
import { cn } from "@plane/utils";
import { Popover } from "@plane/propel/popover";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader } from "@plane/ui";
import { ProgressTrackingBadge } from "@/plane-web/components/issues/issue-layouts/progress-tracking-badge";
import { getProgressStatus } from "@/plane-web/components/issues/issue-layouts/progress-tracking-utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

const PAGE_SIZE = 10;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export type ProjectLookup = { name: string; identifier: string };
export type StateLookup = { name: string; color: string; group: string };

export type EnrichedIssue = TBaseIssue & {
  _workspaceSlug: string;
  _workspaceName: string;
  _project?: ProjectLookup;
  _state?: StateLookup;
  _mainCategoryName?: string;
  _subCategoryName?: string;
};

type SortDir = "asc" | "desc";
type SortConfig = { col: string; dir: SortDir } | null;

const SORTABLE = new Set([
  "department",
  "main_category",
  "sub_category",
  "project",
  "state",
  "start_date",
  "due_date",
  "progress",
]);
const FILTERABLE = new Set(["department", "main_category", "sub_category", "project", "state", "progress"]);

const getVal = (issue: EnrichedIssue, col: string): string => {
  switch (col) {
    case "department":
      return issue._workspaceName ?? "";
    case "main_category":
      return issue._mainCategoryName ?? "";
    case "sub_category":
      return issue._subCategoryName ?? "";
    case "project":
      return issue._project?.name ?? "";
    case "state":
      return issue._state?.name ?? "";
    case "start_date":
      return issue.start_date ?? "";
    case "due_date":
      return issue.target_date ?? "";
    case "progress": {
      const ps = getProgressStatus(issue.target_date ?? null);
      return ps?.label ?? "";
    }
    default:
      return "";
  }
};

// ─── Column header with combined sort + filter popover ───────────────────────

interface ColHeaderProps {
  col: string;
  label: string;
  sortConfig: SortConfig;
  filters: Record<string, string[]>;
  uniqueValues: Record<string, string[]>;
  onSetSort: (col: string, dir: SortDir | null) => void;
  onToggleFilter: (col: string, val: string) => void;
  onClearFilter: (col: string) => void;
}

const ColHeader = ({
  col,
  label,
  sortConfig,
  filters,
  uniqueValues,
  onSetSort,
  onToggleFilter,
  onClearFilter,
}: ColHeaderProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isSortable = SORTABLE.has(col);
  const isFilterable = FILTERABLE.has(col);
  const isSorted = sortConfig?.col === col;
  const isFiltered = (filters[col]?.length ?? 0) > 0;
  const isActive = isSorted || isFiltered;

  const options = useMemo(
    () => (uniqueValues[col] ?? []).filter((v) => !search || v.toLowerCase().includes(search.toLowerCase())),
    [uniqueValues, col, search]
  );

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setSearch("");
  };

  return (
    <th className="py-2.5 pr-3 pl-3 align-middle whitespace-nowrap">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <Popover.Button
          className={cn(
            "group flex cursor-pointer items-center gap-1.5 text-12 font-semibold tracking-wide uppercase transition-colors select-none",
            isActive ? "text-accent-primary" : "text-tertiary hover:text-secondary"
          )}
        >
          {label}
          {isSorted ? (
            sortConfig?.dir === "asc" ? (
              <ArrowUp className="h-3 w-3 flex-shrink-0" />
            ) : (
              <ArrowDown className="h-3 w-3 flex-shrink-0" />
            )
          ) : isSortable ? (
            <ArrowUpDown className="h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-40" />
          ) : null}
          {isFiltered && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-primary" />}
        </Popover.Button>

        <Popover.Panel side="bottom" align="start" sideOffset={6}>
          <div className="shadow-lg max-w-[230px] min-w-[190px] overflow-hidden rounded-lg border border-subtle bg-surface-1">
            {/* Sort section */}
            {isSortable && (
              <div className="py-1">
                <p className="tracking-wider px-3 pt-1.5 pb-1 text-10 font-semibold text-tertiary uppercase">Sort</p>
                {(["asc", "desc"] as SortDir[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => {
                      onSetSort(col, dir);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-13 transition-colors hover:bg-surface-2",
                      isSorted && sortConfig?.dir === dir ? "text-accent-primary" : "text-primary"
                    )}
                  >
                    {dir === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-left">{dir === "asc" ? "Ascending" : "Descending"}</span>
                    {isSorted && sortConfig?.dir === dir && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                ))}
                {isSorted && (
                  <button
                    type="button"
                    onClick={() => {
                      onSetSort(col, null);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-13 text-tertiary transition-colors hover:bg-surface-2 hover:text-danger-primary"
                  >
                    <X className="h-3.5 w-3.5 flex-shrink-0" />
                    Clear sort
                  </button>
                )}
              </div>
            )}

            {/* Filter section */}
            {isFilterable && (
              <>
                {isSortable && <div className="border-t border-subtle" />}
                <div className="py-1">
                  <p className="tracking-wider px-3 pt-1.5 pb-1 text-10 font-semibold text-tertiary uppercase">
                    Filter
                  </p>
                  {/* Search input */}
                  <div className="px-2 pb-1.5">
                    <div className="flex items-center gap-1.5 rounded border border-subtle bg-layer-2 px-2 py-1">
                      <Search className="h-3 w-3 flex-shrink-0 text-tertiary" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full min-w-0 bg-transparent text-12 text-primary outline-none placeholder:text-tertiary"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="flex-shrink-0 text-tertiary hover:text-secondary"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Options list */}
                  <div className="max-h-36 overflow-y-auto">
                    {options.length > 0 ? (
                      options.map((val) => {
                        const checked = filters[col]?.includes(val);
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => onToggleFilter(col, val)}
                            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-13 transition-colors hover:bg-surface-2"
                          >
                            <span
                              className={cn(
                                "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                                checked ? "border-accent-primary bg-accent-primary" : "border-subtle"
                              )}
                            >
                              {checked && <Check className="h-2 w-2 text-white" />}
                            </span>
                            <span className={cn("truncate", checked ? "text-primary" : "text-secondary")}>{val}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-3 py-2 text-12 text-tertiary">No results</p>
                    )}
                  </div>
                  {/* Clear filter */}
                  {isFiltered && (
                    <>
                      <div className="mt-1 border-t border-subtle" />
                      <button
                        type="button"
                        onClick={() => onClearFilter(col)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-13 text-danger-primary transition-colors hover:bg-surface-2"
                      >
                        <X className="h-3.5 w-3.5 flex-shrink-0" />
                        Clear filter ({filters[col].length})
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </Popover.Panel>
      </Popover>
    </th>
  );
};

// ─── Main table ───────────────────────────────────────────────────────────────

interface WorkItemsTableProps {
  issues: EnrichedIssue[];
  isLoading: boolean;
  i18nNs: "today_work_items" | "overdue_work_items";
}

export const WorkItemsTable = ({ issues, isLoading, i18nNs }: WorkItemsTableProps) => {
  const { t } = useTranslation();
  const { setPeekIssue } = useIssueDetail();

  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Group sub-items under their parents within the current dataset.
  // Top-level rows = items with no parent_id, or whose parent isn't in this set (orphans).
  const { topLevelIssues, childrenByParentId } = useMemo(() => {
    const idSet = new Set(issues.map((i) => i.id));
    const childrenMap = new Map<string, EnrichedIssue[]>();
    const tops: EnrichedIssue[] = [];
    for (const issue of issues) {
      const pid = issue.parent_id;
      if (pid && idSet.has(pid)) {
        const arr = childrenMap.get(pid) ?? [];
        arr.push(issue);
        childrenMap.set(pid, arr);
      } else {
        tops.push(issue);
      }
    }
    return { topLevelIssues: tops, childrenByParentId: childrenMap };
  }, [issues]);

  const colLabel = useCallback((key: string) => t(`profile.stats.${i18nNs}.columns.${key}`), [t, i18nNs]);

  const hasActiveFilters = useMemo(() => Object.values(filters).some((vals) => vals.length > 0), [filters]);

  const issueMatchesFilters = useCallback(
    (issue: EnrichedIssue) =>
      Object.entries(filters).every(([col, vals]) => vals.length === 0 || vals.includes(getVal(issue, col))),
    [filters]
  );

  // Labels for active-filter strip
  const COL_LABELS: Record<string, string> = useMemo(
    () => ({
      department: colLabel("department"),
      main_category: colLabel("main_category"),
      sub_category: colLabel("sub_category"),
      project: colLabel("project"),
      state: colLabel("state"),
      progress: colLabel("progress"),
      start_date: colLabel("start_date"),
      due_date: colLabel("due_date"),
    }),
    [colLabel]
  );

  // Filter options must include sub-work items because filtered results can show
  // child rows independently when "show sub-work items" data is present.
  const uniqueValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const col of FILTERABLE) result[col] = [...new Set(issues.map((i) => getVal(i, col)).filter(Boolean))].sort();
    return result;
  }, [issues]);

  const processedIssues = useMemo(() => {
    const result = [...topLevelIssues].filter((issue) => {
      if (!hasActiveFilters) return true;
      if (issueMatchesFilters(issue)) return true;

      const children = childrenByParentId.get(issue.id) ?? [];
      return children.some(issueMatchesFilters);
    });

    // Default order comes from the backend (off_track → due_today → at_risk → on_track).
    // Only override when the user picks an explicit column sort.
    if (sortConfig) {
      result.sort((a, b) => {
        const va = getVal(a, sortConfig.col),
          vb = getVal(b, sortConfig.col);
        if (!va && !vb) return 0;
        if (!va) return 1;
        if (!vb) return -1;
        return sortConfig.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return result;
  }, [childrenByParentId, hasActiveFilters, issueMatchesFilters, sortConfig, topLevelIssues]);

  const totalPages = Math.max(1, Math.ceil(processedIssues.length / PAGE_SIZE));
  const paginatedIssues = processedIssues.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSetSort = (col: string, dir: SortDir | null) => {
    setSortConfig(dir ? { col, dir } : null);
    setPage(1);
  };

  const handleToggleFilter = (col: string, val: string) => {
    setFilters((prev) => {
      const cur = prev[col] ?? [];
      return { ...prev, [col]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] };
    });
    setPage(1);
  };

  const handleClearFilter = (col: string) => {
    setFilters((prev) => ({ ...prev, [col]: [] }));
    setPage(1);
  };

  const handleClearAll = () => {
    setSortConfig(null);
    setFilters({});
    setPage(1);
  };

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderRow = (issue: EnrichedIssue, depth: number, childCount: number, isExpanded: boolean) => {
    const project = issue._project;
    const state = issue._state;
    const hasChildren = childCount > 0;
    const isChild = depth > 0;
    return (
      <tr
        key={`${issue._workspaceSlug}-${issue.id}`}
        className={cn(
          "group border-b border-subtle transition-colors hover:bg-surface-2",
          isChild && "bg-surface-2/30"
        )}
      >
        <td
          className={cn(
            "sticky left-0 z-10 min-w-[260px] border-r border-subtle py-2.5 pr-3 transition-colors group-hover:bg-surface-2",
            isChild ? "bg-surface-2/30" : "bg-surface-1"
          )}
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(issue.id)}
                aria-label={isExpanded ? t("common.collapse") : t("common.expand")}
                className="-ml-0.5 flex-shrink-0 rounded p-0.5 text-tertiary transition-colors hover:bg-surface-2 hover:text-secondary"
              >
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform duration-150", isExpanded && "rotate-90")}
                />
              </button>
            ) : (
              <span aria-hidden className={cn("flex-shrink-0", isChild ? "w-2" : "w-4")} />
            )}
            {isChild && <span aria-hidden className="bg-subtle h-px w-2 flex-shrink-0" />}
            <button
              type="button"
              onClick={() =>
                issue.project_id &&
                issue.id &&
                void setPeekIssue({
                  workspaceSlug: issue._workspaceSlug,
                  projectId: issue.project_id,
                  issueId: issue.id,
                })
              }
              className="group/btn flex min-w-0 flex-1 items-center gap-1.5 text-left"
            >
              <span className="flex-shrink-0 text-12 text-tertiary tabular-nums">
                {project?.identifier ? `${project.identifier}-${issue.sequence_id}` : issue.sequence_id}
              </span>
              <span
                className={cn(
                  "truncate text-13 font-medium transition-colors group-hover/btn:text-accent-primary",
                  isChild ? "text-secondary" : "text-primary"
                )}
              >
                {issue.name}
              </span>
            </button>
          </div>
        </td>
        <td className="max-w-[90px] py-2.5 pr-3 pl-3 text-13 text-secondary">
          <span className="block truncate">{issue._workspaceName}</span>
        </td>
        <td className="max-w-[90px] py-2.5 pr-3 pl-3 text-13 text-secondary">
          <span className="block truncate">{issue._mainCategoryName ?? <span className="text-tertiary">—</span>}</span>
        </td>
        <td className="max-w-[90px] py-2.5 pr-3 pl-3 text-13 text-secondary">
          <span className="block truncate">{issue._subCategoryName ?? <span className="text-tertiary">—</span>}</span>
        </td>
        <td className="max-w-[90px] py-2.5 pr-3 pl-3 text-13 text-secondary">
          <span className="block truncate">{project?.name ?? <span className="text-tertiary">—</span>}</span>
        </td>
        <td className="max-w-[80px] py-2.5 pr-3 pl-3">
          {state ? (
            <span
              className="inline-flex h-5 max-w-[80px] items-center truncate rounded px-1.5 text-11 font-medium"
              style={{
                color: state.color,
                backgroundColor: `${state.color}18`,
                outline: `1px solid ${state.color}40`,
              }}
            >
              {state.name}
            </span>
          ) : (
            <span className="text-13 text-tertiary">—</span>
          )}
        </td>
        <td className="max-w-[90px] py-2.5 pr-3 pl-3">
          <ProgressTrackingBadge targetDate={issue.target_date} />
        </td>
        <td className="py-2.5 pr-3 pl-3 text-13 whitespace-nowrap text-secondary tabular-nums">
          {formatDate(issue.start_date)}
        </td>
        <td className="py-2.5 pr-3 pl-3 text-13 whitespace-nowrap text-secondary tabular-nums">
          {formatDate(issue.target_date)}
        </td>
      </tr>
    );
  };

  const activeFilterEntries = Object.entries(filters).flatMap(([col, vals]) => vals.map((val) => ({ col, val })));
  const hasAnyActive = sortConfig !== null || activeFilterEntries.length > 0;

  const colProps = {
    sortConfig,
    filters,
    uniqueValues,
    onSetSort: handleSetSort,
    onToggleFilter: handleToggleFilter,
    onClearFilter: handleClearFilter,
  };

  if (isLoading) {
    return (
      <Loader className="space-y-4">
        <Loader.Item height="36px" />
        <Loader.Item height="36px" />
        <Loader.Item height="36px" />
        <Loader.Item height="36px" />
      </Loader>
    );
  }

  if (issues.length === 0) {
    return <EmptyStateCompact title={t(`profile.stats.${i18nNs}.empty`)} assetKey="unknown" assetClassName="size-20" />;
  }

  return (
    <div>
      {/* Active sort/filter chips */}
      {hasAnyActive && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-subtle bg-surface-2/40 px-4 py-2.5">
          {sortConfig && (
            <span className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-1 px-2.5 py-0.5 text-12 text-secondary">
              {sortConfig.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {COL_LABELS[sortConfig.col]}
              <button
                type="button"
                onClick={() => handleSetSort(sortConfig.col, null)}
                className="ml-1 transition-colors hover:text-danger-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {activeFilterEntries.map(({ col, val }) => (
            <span
              key={`${col}-${val}`}
              className="border-accent-primary/25 inline-flex items-center gap-1 rounded-full border bg-accent-primary/10 px-2.5 py-0.5 text-12 text-accent-primary"
            >
              {COL_LABELS[col]}: <span className="font-medium">{val}</span>
              <button
                type="button"
                onClick={() => handleToggleFilter(col, val)}
                className="ml-1 transition-opacity hover:opacity-60"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-auto flex items-center gap-1 text-12 text-tertiary transition-colors hover:text-danger-primary"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      )}

      {/* Table — opt into the always-visible horizontal scrollbar utility so mouse
          users get a draggable bar (global CSS hides native scrollbars by default) */}
      <div className="horizontal-scrollbar scrollbar-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-subtle bg-surface-2">
              <th className="sticky left-0 z-20 min-w-[260px] border-r border-subtle bg-surface-2 py-2.5 pr-3 pl-4 text-12 font-semibold tracking-wide whitespace-nowrap text-tertiary uppercase">
                {colLabel("work_item")}
              </th>
              {(["department", "main_category", "sub_category", "project", "state", "progress"] as const).map((c) => (
                <ColHeader key={c} col={c} label={colLabel(c)} {...colProps} />
              ))}
              <ColHeader col="start_date" label={colLabel("start_date")} {...colProps} />
              <ColHeader col="due_date" label={colLabel("due_date")} {...colProps} />
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {paginatedIssues.length > 0 ? (
              paginatedIssues.flatMap((issue) => {
                const children = childrenByParentId.get(issue.id) ?? [];
                const visibleChildren = hasActiveFilters ? children.filter(issueMatchesFilters) : children;
                const isExpanded = hasActiveFilters ? visibleChildren.length > 0 : expandedIds.has(issue.id);
                const rows: React.ReactNode[] = [renderRow(issue, 0, visibleChildren.length, isExpanded)];
                if (isExpanded && visibleChildren.length > 0) {
                  for (const child of visibleChildren) rows.push(renderRow(child, 1, 0, false));
                }
                return rows;
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-10 text-center text-13 text-tertiary">
                  No results match the active filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-subtle px-4 py-3 text-13 text-secondary">
          <span className="text-12 text-tertiary">
            {t(`profile.stats.${i18nNs}.pagination.showing`, {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, processedIssues.length),
              total: processedIssues.length,
            })}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "rounded p-1.5 transition-colors hover:bg-surface-2",
                page === 1 && "cursor-not-allowed opacity-40"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "h-7 min-w-[28px] rounded px-1.5 text-12 transition-colors",
                  p === page ? "bg-accent-primary font-medium text-white" : "hover:bg-surface-2"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "rounded p-1.5 transition-colors hover:bg-surface-2",
                page === totalPages && "cursor-not-allowed opacity-40"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
