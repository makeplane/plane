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

const SORTABLE = new Set(["department", "main_category", "sub_category", "project", "state", "start_date", "due_date"]);
const FILTERABLE = new Set(["department", "main_category", "sub_category", "project", "state"]);

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
    <th className="py-2.5 pr-4 whitespace-nowrap align-middle">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <Popover.Button
          className={cn(
            "flex items-center gap-1.5 text-12 font-semibold uppercase tracking-wide transition-colors select-none cursor-pointer group",
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
            <ArrowUpDown className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
          ) : null}
          {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" />}
        </Popover.Button>

        <Popover.Panel side="bottom" align="start" sideOffset={6}>
          <div className="bg-surface-1 border border-subtle rounded-lg shadow-lg min-w-[190px] max-w-[230px] overflow-hidden">
            {/* Sort section */}
            {isSortable && (
              <div className="py-1">
                <p className="px-3 pt-1.5 pb-1 text-10 font-semibold uppercase tracking-wider text-tertiary">Sort</p>
                {(["asc", "desc"] as SortDir[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => {
                      onSetSort(col, dir);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-13 hover:bg-surface-2 transition-colors",
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-13 text-tertiary hover:bg-surface-2 hover:text-danger-primary transition-colors"
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
                  <p className="px-3 pt-1.5 pb-1 text-10 font-semibold uppercase tracking-wider text-tertiary">
                    Filter
                  </p>
                  {/* Search input */}
                  <div className="px-2 pb-1.5">
                    <div className="flex items-center gap-1.5 bg-layer-2 border border-subtle rounded px-2 py-1">
                      <Search className="h-3 w-3 text-tertiary flex-shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="bg-transparent text-12 text-primary placeholder:text-tertiary outline-none w-full min-w-0"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="text-tertiary hover:text-secondary flex-shrink-0"
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
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-13 hover:bg-surface-2 transition-colors"
                          >
                            <span
                              className={cn(
                                "w-3.5 h-3.5 flex-shrink-0 rounded border flex items-center justify-center transition-colors",
                                checked ? "bg-accent-primary border-accent-primary" : "border-subtle"
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
                      <div className="border-t border-subtle mt-1" />
                      <button
                        type="button"
                        onClick={() => onClearFilter(col)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-13 text-danger-primary hover:bg-surface-2 transition-colors"
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

  const colLabel = useCallback((key: string) => t(`profile.stats.${i18nNs}.columns.${key}`), [t, i18nNs]);

  // Labels for active-filter strip
  const COL_LABELS: Record<string, string> = useMemo(
    () => ({
      department: colLabel("department"),
      main_category: colLabel("main_category"),
      sub_category: colLabel("sub_category"),
      project: colLabel("project"),
      state: colLabel("state"),
      start_date: colLabel("start_date"),
      due_date: colLabel("due_date"),
    }),
    [colLabel]
  );

  const uniqueValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const col of FILTERABLE) result[col] = [...new Set(issues.map((i) => getVal(i, col)).filter(Boolean))].sort();
    return result;
  }, [issues]);

  const processedIssues = useMemo(() => {
    let result = [...issues];
    for (const [col, vals] of Object.entries(filters)) {
      if (vals.length > 0) result = result.filter((i) => vals.includes(getVal(i, col)));
    }
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
  }, [issues, filters, sortConfig]);

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
        <div className="flex items-center gap-1.5 flex-wrap px-4 py-2.5 border-b border-subtle bg-surface-2/40">
          {sortConfig && (
            <span className="inline-flex items-center gap-1 text-12 bg-surface-1 border border-subtle rounded-full px-2.5 py-0.5 text-secondary">
              {sortConfig.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {COL_LABELS[sortConfig.col]}
              <button
                type="button"
                onClick={() => handleSetSort(sortConfig.col, null)}
                className="ml-1 hover:text-danger-primary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {activeFilterEntries.map(({ col, val }) => (
            <span
              key={`${col}-${val}`}
              className="inline-flex items-center gap-1 text-12 bg-accent-primary/10 border border-accent-primary/25 rounded-full px-2.5 py-0.5 text-accent-primary"
            >
              {COL_LABELS[col]}: <span className="font-medium">{val}</span>
              <button
                type="button"
                onClick={() => handleToggleFilter(col, val)}
                className="ml-1 hover:opacity-60 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-auto text-12 text-tertiary hover:text-danger-primary flex items-center gap-1 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-2/50 border-b border-subtle">
              <th className="py-2.5 pl-4 pr-4 text-12 font-semibold uppercase tracking-wide text-tertiary whitespace-nowrap">
                {colLabel("work_item")}
              </th>
              {(["department", "main_category", "sub_category", "project", "state"] as const).map((c) => (
                <ColHeader key={c} col={c} label={colLabel(c)} {...colProps} />
              ))}
              <th className="py-2.5 pr-4 text-12 font-semibold uppercase tracking-wide text-tertiary whitespace-nowrap">
                {colLabel("progress")}
              </th>
              <ColHeader col="start_date" label={colLabel("start_date")} {...colProps} />
              <ColHeader col="due_date" label={colLabel("due_date")} {...colProps} />
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {paginatedIssues.length > 0 ? (
              paginatedIssues.map((issue) => {
                const project = issue._project;
                const state = issue._state;
                return (
                  <tr
                    key={`${issue._workspaceSlug}-${issue.id}`}
                    className="hover:bg-surface-2/50 transition-colors group"
                  >
                    <td className="py-3 pl-4 pr-4">
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
                        className="flex items-center gap-2 text-left max-w-[280px] lg:max-w-[360px] group/btn"
                      >
                        <span className="flex-shrink-0 text-tertiary text-12 tabular-nums">
                          {project?.identifier ? `${project.identifier}-${issue.sequence_id}` : issue.sequence_id}
                        </span>
                        <span className="truncate text-13 text-primary font-medium group-hover/btn:text-accent-primary transition-colors">
                          {issue.name}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-13 text-secondary max-w-[130px]">
                      <span className="truncate block">{issue._workspaceName}</span>
                    </td>
                    <td className="py-3 pr-4 text-13 text-secondary max-w-[130px]">
                      <span className="truncate block">
                        {issue._mainCategoryName ?? <span className="text-tertiary">—</span>}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-13 text-secondary max-w-[130px]">
                      <span className="truncate block">
                        {issue._subCategoryName ?? <span className="text-tertiary">—</span>}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-13 text-secondary max-w-[130px]">
                      <span className="truncate block">
                        {project?.name ?? <span className="text-tertiary">—</span>}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {state ? (
                        <span
                          className="inline-flex h-5 items-center rounded px-2 text-12 font-medium max-w-[130px] truncate"
                          style={{
                            color: state.color,
                            backgroundColor: `${state.color}18`,
                            outline: `1px solid ${state.color}40`,
                          }}
                        >
                          {state.name}
                        </span>
                      ) : (
                        <span className="text-tertiary text-13">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <ProgressTrackingBadge targetDate={issue.target_date} />
                    </td>
                    <td className="py-3 pr-4 text-13 text-secondary whitespace-nowrap tabular-nums">
                      {formatDate(issue.start_date)}
                    </td>
                    <td className="py-3 pr-4 text-13 text-secondary whitespace-nowrap tabular-nums">
                      {formatDate(issue.target_date)}
                    </td>
                  </tr>
                );
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-subtle text-13 text-secondary">
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
                "p-1.5 rounded hover:bg-surface-2 transition-colors",
                page === 1 && "opacity-40 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "min-w-[28px] h-7 px-1.5 rounded text-12 transition-colors",
                  p === page ? "bg-accent-primary text-white font-medium" : "hover:bg-surface-2"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "p-1.5 rounded hover:bg-surface-2 transition-colors",
                page === totalPages && "opacity-40 cursor-not-allowed"
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
