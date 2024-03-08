import { useCallback, useRef, useState } from "react";
import { Tab } from "@headlessui/react";
import { ListFilter, Search, X } from "lucide-react";
// hooks
import useCycleFilters from "hooks/use-cycle-filters";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { CycleFiltersSelection, OrderByDropdown } from "components/cycles";
import { FiltersDropdown } from "components/issues";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TCycleFilters } from "@plane/types";
// constants
import { CYCLE_TABS_LIST, CYCLE_VIEW_LAYOUTS } from "constants/cycle";

type Props = {
  handleUpdateSearchQuery: (value: string) => void;
  projectId: string;
  searchQuery: string;
};

export const CyclesViewHeader: React.FC<Props> = (props) => {
  const { handleUpdateSearchQuery, projectId, searchQuery } = props;
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // hooks
  const { displayFilters, filters, handleUpdateDisplayFilters, handleUpdateFilters } = useCycleFilters(projectId);
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TCycleFilters, value: string | string[]) => {
      const newValues = filters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      else {
        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      handleUpdateFilters({ [key]: newValues });
    },
    [filters, handleUpdateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") handleUpdateSearchQuery("");
      else setIsSearchOpen(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-custom-border-200 px-4 sm:px-5 sm:pb-0">
      <Tab.List as="div" className="flex items-center overflow-x-scroll">
        {CYCLE_TABS_LIST.map((tab) => (
          <Tab
            key={tab.key}
            className={({ selected }) =>
              `border-b-2 p-4 text-sm font-medium outline-none ${
                selected ? "border-custom-primary-100 text-custom-primary-100" : "border-transparent"
              }`
            }
          >
            {tab.name}
          </Tab>
        ))}
      </Tab.List>
      {displayFilters?.active_tab !== "active" && (
        <div className="hidden h-full sm:flex items-center gap-3 self-end">
          {!isSearchOpen && (
            <button
              type="button"
              className="-mr-3"
              onClick={() => {
                setIsSearchOpen(true);
                inputRef.current?.focus();
              }}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          )}
          <div
            className={cn(
              "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear",
              {
                "w-64 px-2.5 py-1.5 border-custom-border-200": isSearchOpen,
              }
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <input
              ref={inputRef}
              className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 focus:outline-none"
              placeholder="Search"
              value={searchQuery}
              autoFocus
              onChange={(e) => handleUpdateSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            {isSearchOpen && (
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  handleUpdateSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <OrderByDropdown
            value={displayFilters?.order_by}
            onChange={(val) => {
              if (val === displayFilters?.order_by) return;
              handleUpdateDisplayFilters({
                order_by: val,
              });
            }}
          />
          <FiltersDropdown icon={<ListFilter className="h-3 w-3" />} title="Filters" placement="bottom-end">
            <CycleFiltersSelection filters={filters ?? {}} handleFiltersUpdate={handleFilters} />
          </FiltersDropdown>
          <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
            {CYCLE_VIEW_LAYOUTS.map((layout) => (
              <Tooltip key={layout.key} tooltipContent={layout.title}>
                <button
                  type="button"
                  className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100 ${
                    displayFilters?.layout == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
                  }`}
                  onClick={() =>
                    handleUpdateDisplayFilters({
                      layout: layout.key,
                    })
                  }
                >
                  <layout.icon
                    strokeWidth={2}
                    className={`h-3.5 w-3.5 ${
                      displayFilters?.layout == layout.key ? "text-custom-text-100" : "text-custom-text-200"
                    }`}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
