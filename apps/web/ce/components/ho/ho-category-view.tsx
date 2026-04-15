import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { SearchIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoCategoryTable } from "./ho-category-table";
import { HoWorkspaceSelect } from "./ho-workspace-select";

type SortKey = keyof THoCategorySummary;

const PAGE_SIZE = 20;

/** Returns page numbers to display, with `null` representing an ellipsis gap. */
function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, null, total];
  if (current >= total - 3) return [1, null, total - 4, total - 3, total - 2, total - 1, total];
  return [1, null, current - 1, current, current + 1, null, total];
}

export const HoCategoryView = observer(function HoCategoryView() {
  const { t } = useTranslation();
  const store = useHoIssues();
  const [search, setSearch] = useState("");
  const [sortKey] = useState<SortKey | null>("department_name");
  const [sortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void store.fetchCategorySummary();
    void store.fetchFilterOptions();
  }, [store]);

  const filtered = useMemo(() => {
    // Apply department filter first (client-side — summary is always fully loaded)
    let data = store.selectedDepartmentId
      ? store.categorySummary.filter((r) => r.department_id === store.selectedDepartmentId)
      : store.categorySummary;

    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((r) =>
      [r.department_name, r.main_task_category_name, r.sub_task_category_name].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [store.categorySummary, store.selectedDepartmentId, search]);

  const sortedData = useMemo(() => {
    const data = [...filtered];
    if (!sortKey) return data;

    return data.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const pageData = useMemo(
    () => sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedData, page]
  );

  // Reset to page 1 whenever the filtered/sorted result set changes
  useEffect(() => { setPage(1); }, [sortedData.length, store.selectedDepartmentId, search]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar: consistent with Datasheet toolbar style */}
      <div className="flex items-center justify-end gap-2 border-b border-subtle bg-surface-1 px-page-x py-2">
        <HoWorkspaceSelect />

        {/* Search */}
        <div className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5">
          <SearchIcon className="h-4 w-4 text-tertiary" />
          <input
            className="w-full max-w-[200px] border-none bg-transparent text-13 text-primary outline-none placeholder:text-tertiary"
            placeholder={t("ho.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {store.isCategoryLoading && store.categorySummary.length === 0 ? (
        <div className="py-9 px-page-x space-y-2">
          <Loader className="space-y-2">
            <Loader.Item height="36px" />
            <Loader.Item height="36px" />
            <Loader.Item height="36px" />
          </Loader>
        </div>
      ) : (
        <>
          <HoCategoryTable data={pageData} />
          {sortedData.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-placeholder">
              {search ? t("ho.no_matching_rows") : t("ho.no_data")}
            </div>
          ) : totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded px-2 py-1 text-13 text-secondary disabled:opacity-40 hover:bg-surface-2"
              >
                ‹
              </button>
              {getPageNumbers(page, totalPages).map((n, i) =>
                n === null ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-13 text-tertiary">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      "min-w-[28px] rounded px-2 py-1 text-13",
                      n === page ? "bg-accent-primary text-white" : "text-secondary hover:bg-surface-2"
                    )}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded px-2 py-1 text-13 text-secondary disabled:opacity-40 hover:bg-surface-2"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});
