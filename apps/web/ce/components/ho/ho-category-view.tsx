import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { SearchIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoCategoryTable } from "./ho-category-table";
import { HoWorkspaceSelect } from "./ho-workspace-select";

// Maps backend order_by field names to THoCategorySummary keys
const ORDER_BY_FIELD_MAP: Record<string, keyof THoCategorySummary> = {
  project__workspace__name: "department_name",
  main_task_category__name: "main_task_category_name",
  sub_task_category__name: "sub_task_category_name",
};

export const HoCategoryView = observer(function HoCategoryView() {
  const { t } = useTranslation();
  const store = useHoIssues();
  const [search, setSearch] = useState("");

  useEffect(() => {
    void store.fetchCategorySummary();
    void store.fetchFilterOptions();
  }, [store]);

  const filtered = useMemo(() => {
    let data = store.selectedDepartmentId
      ? store.categorySummary.filter((r) => r.department_id === store.selectedDepartmentId)
      : store.categorySummary;

    if (store.filters.department.length > 0)
      data = data.filter((r) => store.filters.department.includes(r.department_name));
    if (store.filters.main_task_category.length > 0)
      data = data.filter((r) => store.filters.main_task_category.includes(r.main_task_category_name ?? ""));
    if (store.filters.sub_task_category.length > 0)
      data = data.filter((r) => store.filters.sub_task_category.includes(r.sub_task_category_name ?? ""));

    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((r) =>
      [r.department_name, r.main_task_category_name, r.sub_task_category_name].some((v) => v?.toLowerCase().includes(q))
    );
  }, [
    store.categorySummary,
    store.selectedDepartmentId,
    store.filters.department,
    store.filters.main_task_category,
    store.filters.sub_task_category,
    search,
  ]);

  const sortedData = useMemo(() => {
    const data = [...filtered];
    const orderBy = store.orderBy;
    if (!orderBy) return data;

    const isDesc = orderBy.startsWith("-");
    const field = isDesc ? orderBy.slice(1) : orderBy;
    const key = ORDER_BY_FIELD_MAP[field];
    if (!key) return data;

    return data.sort((a, b) => {
      const av = String(a[key] ?? "");
      const bv = String(b[key] ?? "");
      return isDesc ? bv.localeCompare(av) : av.localeCompare(bv);
    });
  }, [filtered, store.orderBy]);

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
          <HoCategoryTable data={sortedData} />
          {sortedData.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-placeholder">
              {search ? t("ho.no_matching_rows") : t("ho.no_data")}
            </div>
          )}
        </>
      )}
    </div>
  );
});
