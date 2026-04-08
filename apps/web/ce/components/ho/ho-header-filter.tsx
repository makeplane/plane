import { observer } from "mobx-react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, ChevronsUpDown, Search, X } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { useState } from "react";

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

  const isActiveSort = store.orderBy === asc || store.orderBy === desc;
  const SortIcon =
    store.orderBy === asc ? ArrowUpNarrowWide : store.orderBy === desc ? ArrowDownWideNarrow : ChevronsUpDown;

  const activeFilters = (filterKey ? (store.filters as Record<string, unknown>)[filterKey] : []) as string[] | null;
  const isFiltered = Array.isArray(activeFilters)
    ? activeFilters.length > 0
    : activeFilters !== null && activeFilters !== undefined;

  const handleToggleFilter = (value: string) => {
    if (!filterKey) return;
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

  const filteredOptions = options
    ?.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((opt, index, self) => index === self.findIndex((t) => t.value === opt.value));

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
            {isActiveSort && <SortIcon className="h-3 w-3 flex-shrink-0" />}
            {isFiltered && <div className="h-1.5 w-1.5 rounded-full bg-accent-primary" />}
            {!isActiveSort && !isFiltered && <ChevronsUpDown className="h-3 w-3 flex-shrink-0 opacity-50" />}
          </div>
        </div>
      }
      placement="bottom-start"
      closeOnSelect={!options}
    >
      <div className="max-h-96 overflow-y-auto vertical-scrollbar scrollbar-sm py-1">
        {asc && (
          <CustomMenu.MenuItem onClick={() => store.updateOrderBy(asc)}>
            <span className="flex items-center gap-2">
              <ArrowUpNarrowWide className="h-3 w-3" /> {t("ho.ascending")}
            </span>
          </CustomMenu.MenuItem>
        )}
        {desc && (
          <CustomMenu.MenuItem onClick={() => store.updateOrderBy(desc)}>
            <span className="flex items-center gap-2">
              <ArrowDownWideNarrow className="h-3 w-3" /> {t("ho.descending")}
            </span>
          </CustomMenu.MenuItem>
        )}
        {(asc || desc) && <div className="my-1 border-t border-subtle" />}

        {options && (
          <>
            <div className="px-2 py-1">
              <div className="flex items-center gap-2 rounded bg-custom-background-80 px-2 py-1.5 border border-subtle focus-within:border-accent-primary transition-all">
                <Search className="h-3.5 w-3.5 text-secondary" />
                <input
                  type="text"
                  className="w-full bg-transparent text-12 outline-none py-0.5"
                  placeholder={t("ho.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")}>
                    <X className="h-3 w-3 text-secondary" />
                  </button>
                )}
              </div>
            </div>
            <div className="py-1">
              {filteredOptions?.map((opt) => (
                <CustomMenu.MenuItem
                  key={opt.value}
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleFilter(opt.value);
                  }}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate">{opt.label}</span>
                    {(Array.isArray(activeFilters)
                      ? activeFilters.includes(opt.value)
                      : activeFilters === opt.value) && <Check className="h-3.5 w-3.5 text-accent-primary" />}
                  </div>
                </CustomMenu.MenuItem>
              ))}
              {filteredOptions?.length === 0 && (
                <div className="px-4 py-2 text-12 text-secondary">{t("ho.no_matching_rows")}</div>
              )}
            </div>
            <div className="my-1 border-t border-subtle" />
          </>
        )}

        <CustomMenu.MenuItem
          onClick={() => {
            if (filterKey) store.updateFilters({ [filterKey]: multiple ? [] : null });
            store.updateOrderBy("-created_at");
          }}
        >
          <span className="flex items-center gap-2 text-red-500">{t("ho.clear_filters_sort")}</span>
        </CustomMenu.MenuItem>
      </div>
    </CustomMenu>
  );
});
