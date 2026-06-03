import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, ChevronsUpDown, RotateCcw, Search, X } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useHoIssues } from "@/hooks/store/use-ho-issues";

type Props = {
  columnKey?: string;
  label: string;
  asc?: string;
  desc?: string;
  filterKey?: string;
  options?: { value: string; label: string }[];
  multiple?: boolean;
};

export const HoHeaderFilter = observer(function HoHeaderFilter({
  label,
  asc,
  desc,
  filterKey,
  options,
  multiple = true,
}: Props) {
  const { t } = useTranslation();
  const store = useHoIssues();
  const [searchQuery, setSearchQuery] = useState("");

  const isAscActive = !!asc && store.orderBy === asc;
  const isDescActive = !!desc && store.orderBy === desc;
  const isActiveSort = isAscActive || isDescActive;
  const SortIcon = isAscActive ? ArrowUpNarrowWide : isDescActive ? ArrowDownWideNarrow : ChevronsUpDown;

  // department + project filters bind to top-level state (mirrored with top-bar selectors)
  const isTopLevelKey = filterKey === "project";
  const readTopLevel = (): string[] =>
    filterKey === "department" ? store.selectedDepartmentIds : filterKey === "project" ? store.selectedProjectIds : [];
  const writeTopLevel = (next: string[]) => {
    if (filterKey === "department") store.setDepartmentFilter(next);
    else if (filterKey === "project") store.setProjectFilter(next);
  };

  const activeFilters = (
    isTopLevelKey ? readTopLevel() : filterKey ? (store.filters as Record<string, unknown>)[filterKey] : []
  ) as string[] | string | null;
  const selectedCount = Array.isArray(activeFilters) ? activeFilters.length : activeFilters ? 1 : 0;
  const isFiltered = selectedCount > 0;

  const isSelected = (value: string) =>
    Array.isArray(activeFilters) ? activeFilters.includes(value) : activeFilters === value;

  const handleToggleFilter = (value: string) => {
    if (!filterKey) return;
    if (isTopLevelKey) {
      const current = readTopLevel();
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      writeTopLevel(next);
      return;
    }
    const current = (store.filters as Record<string, unknown>)[filterKey];
    if (multiple) {
      const next = Array.isArray(current)
        ? current.includes(value)
          ? current.filter((v: string) => v !== value)
          : [...current, value]
        : [value];
      store.updateFilters({ [filterKey]: next });
    } else {
      store.updateFilters({ [filterKey]: current === value ? null : value });
    }
  };

  const handleClearFilter = () => {
    if (!filterKey) return;
    if (isTopLevelKey) writeTopLevel([]);
    else store.updateFilters({ [filterKey]: multiple ? [] : null });
  };

  const handleClearSort = () => store.updateOrderBy("-created_at");

  // Dedupe + filter by search + sort selected to top for easier scanning
  const filteredOptions = useMemo(() => {
    if (!options) return [];
    const seen = new Set<string>();
    const deduped = options.filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
    const q = searchQuery.trim().toLowerCase();
    const matched = q ? deduped.filter((o) => o.label.toLowerCase().includes(q)) : deduped;
    return matched.sort((a, b) => {
      const aSel = isSelected(a.value) ? 0 : 1;
      const bSel = isSelected(b.value) ? 0 : 1;
      return aSel - bSel;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, searchQuery, activeFilters]);

  const hasSortSection = !!(asc || desc);
  const hasFilterSection = !!filterKey;

  return (
    <CustomMenu
      className="!w-full h-full"
      customButtonClassName="clickable !w-full h-full flex items-center px-4"
      customButton={
        <div
          className={cn(
            "flex w-full items-center justify-between gap-1.5 py-2 text-13 text-secondary hover:text-primary transition-colors",
            (isActiveSort || isFiltered) && "text-accent-primary"
          )}
        >
          <span className="truncate uppercase tracking-wider">{label}</span>
          <div className="flex items-center gap-1">
            {isFiltered && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold leading-none text-on-color">
                {selectedCount}
              </span>
            )}
            {isActiveSort && <SortIcon className="h-3 w-3 flex-shrink-0" />}
            {!isActiveSort && !isFiltered && <ChevronsUpDown className="h-3 w-3 flex-shrink-0 opacity-50" />}
          </div>
        </div>
      }
      placement="bottom-start"
      closeOnSelect={false}
      maxHeight="lg"
    >
      <div className="min-w-[240px] py-1">
        {/* SORT SECTION */}
        {hasSortSection && (
          <>
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
              {t("ho.sort")}
            </div>
            {asc && (
              <CustomMenu.MenuItem onClick={() => store.updateOrderBy(asc)}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="flex items-center gap-2 text-13">
                    <ArrowUpNarrowWide className="h-3.5 w-3.5 text-secondary" />
                    {t("ho.ascending")}
                  </span>
                  {isAscActive && <Check className="h-3.5 w-3.5 text-accent-primary" />}
                </div>
              </CustomMenu.MenuItem>
            )}
            {desc && (
              <CustomMenu.MenuItem onClick={() => store.updateOrderBy(desc)}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="flex items-center gap-2 text-13">
                    <ArrowDownWideNarrow className="h-3.5 w-3.5 text-secondary" />
                    {t("ho.descending")}
                  </span>
                  {isDescActive && <Check className="h-3.5 w-3.5 text-accent-primary" />}
                </div>
              </CustomMenu.MenuItem>
            )}
          </>
        )}

        {hasSortSection && hasFilterSection && <div className="my-1 border-t border-subtle" />}

        {/* FILTER SECTION */}
        {hasFilterSection && (
          <>
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">{t("ho.filter")}</span>
              {selectedCount > 0 && (
                <span className="text-[10px] font-medium text-accent-primary">
                  {t("ho.selected_count", { count: selectedCount })}
                </span>
              )}
            </div>

            <div className="px-2 pb-1 pt-1">
              <div className="flex items-center gap-2 rounded-md bg-layer-2 px-2 py-1.5 border border-subtle focus-within:border-accent-strong transition-colors">
                <Search className="h-3.5 w-3.5 text-tertiary flex-shrink-0" />
                <input
                  type="text"
                  className="w-full bg-transparent text-12 text-primary outline-none placeholder:text-placeholder"
                  placeholder={t("ho.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-tertiary hover:text-primary transition-colors"
                    aria-label={t("ho.search")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto py-0.5">
              {filteredOptions.length === 0 && (
                <div className="px-3 py-3 text-center text-12 text-tertiary">{t("ho.no_matching_rows")}</div>
              )}
              {filteredOptions.map((opt) => {
                const selected = isSelected(opt.value);
                return (
                  <CustomMenu.MenuItem
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleFilter(opt.value);
                    }}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <span
                        className={cn(
                          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                          selected ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong bg-layer-2"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className={cn("truncate text-13", selected ? "text-primary" : "text-secondary")}>
                        {opt.label}
                      </span>
                    </div>
                  </CustomMenu.MenuItem>
                );
              })}
            </div>
          </>
        )}

        {/* FOOTER ACTIONS */}
        {(isFiltered || isActiveSort) && (
          <>
            <div className="my-1 border-t border-subtle" />
            <div className="flex items-center gap-1 px-1.5 pb-0.5">
              {isFiltered && hasFilterSection && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-12 font-medium text-danger-primary hover:bg-danger-subtle/60 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("ho.clear_filter")}
                </button>
              )}
              {isActiveSort && hasSortSection && (
                <button
                  type="button"
                  onClick={handleClearSort}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-12 font-medium text-secondary hover:bg-layer-1-hover hover:text-primary transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("ho.clear_sort")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </CustomMenu>
  );
});
