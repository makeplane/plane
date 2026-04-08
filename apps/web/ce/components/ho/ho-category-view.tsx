import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { SearchIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoCategoryTable } from "./ho-category-table";
import { HoWorkspaceSelect } from "./ho-workspace-select";
import { HoProjectSelect } from "./ho-project-select";

type SortKey = keyof THoCategorySummary;

export const HoCategoryView = observer(function HoCategoryView() {
  const { t } = useTranslation();
  const store = useHoIssues();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>("department_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    void store.fetchCategorySummary();
    void store.fetchAccessibleWorkspaces();
    void store.fetchFilterOptions();
  }, [store]);

  const filtered = useMemo(() => {
    if (!search) return store.categorySummary;
    const q = search.toLowerCase();
    return store.categorySummary.filter((r) =>
      [r.department_name, r.project_name, r.main_task_category_name, r.sub_task_category_name].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [store.categorySummary, search]);

  const sortedData = useMemo(() => {
    const data = [...filtered];
    if (!sortKey) return data;

    return data.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="size-full py-9 px-page-x lg:px-12">
      {/* Header row: title + filters + date range + search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h4 className="text-h3-medium">{t("ho.category")}</h4>

        <div className="flex flex-wrap items-center gap-2">
          <HoWorkspaceSelect />
          <HoProjectSelect />

          {/* Date range pickers (shared store state) */}
          <span className="text-13 font-medium text-secondary">{t("ho.from")}</span>
          <input
            type="date"
            value={store.fromDate}
            onChange={(e) => store.setDateRange(e.target.value, store.toDate)}
            className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
          />
          <span className="text-13 font-medium text-secondary">{t("ho.to")}</span>
          <input
            type="date"
            value={store.toDate}
            onChange={(e) => store.setDateRange(store.fromDate, e.target.value)}
            className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
          />

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
      </div>

      {store.isCategoryLoading && store.categorySummary.length === 0 ? (
        <Loader className="space-y-2">
          <Loader.Item height="36px" />
          <Loader.Item height="36px" />
          <Loader.Item height="36px" />
        </Loader>
      ) : sortedData.length === 0 ? (
        <p className="mt-16 text-center text-body-xs-regular text-placeholder">
          {search ? t("ho.no_matching_rows") : t("ho.no_data")}
        </p>
      ) : (
        <HoCategoryTable data={sortedData} />
      )}
    </div>
  );
});
