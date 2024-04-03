import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search, X } from "lucide-react";
import { Tab } from "@headlessui/react";
// types
import { TCycleFilters } from "@plane/types";
// ui
import { Tooltip } from "@plane/ui";
// components
import { CycleFiltersSelection } from "@/components/cycles";
import { FiltersDropdown } from "@/components/issues";
// constants
import { CYCLE_TABS_LIST, CYCLE_VIEW_LAYOUTS } from "@/constants/cycle";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useCycleFilter } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  projectId: string;
};

export const CyclesViewHeader: React.FC<Props> = observer((props) => {
  const { projectId } = props;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // hooks
  const {
    currentProjectDisplayFilters,
    currentProjectFilters,
    searchQuery,
    updateDisplayFilters,
    updateFilters,
    updateSearchQuery,
  } = useCycleFilter();
  const { isMobile } = usePlatformOS();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "" ? true : false);
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });
  // derived values
  const activeLayout = currentProjectDisplayFilters?.layout ?? "list";

  const handleFilters = useCallback(
    (key: keyof TCycleFilters, value: string | string[]) => {
      const newValues = currentProjectFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      else {
        if (currentProjectFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId, { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
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
      {currentProjectDisplayFilters?.active_tab !== "active" && (
        <div className="hidden h-full sm:flex items-center gap-3 self-end">
          {!isSearchOpen && (
            <button
              type="button"
              className="-mr-5 p-2 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
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
              "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
              {
                "w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
              }
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <input
              ref={inputRef}
              className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            {isSearchOpen && (
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  updateSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <FiltersDropdown icon={<ListFilter className="h-3 w-3" />} title="Filters" placement="bottom-end">
            <CycleFiltersSelection filters={currentProjectFilters ?? {}} handleFiltersUpdate={handleFilters} />
          </FiltersDropdown>
          <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
            {CYCLE_VIEW_LAYOUTS.map((layout) => (
              <Tooltip key={layout.key} tooltipContent={layout.title} isMobile={isMobile}>
                <button
                  type="button"
                  className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100 ${
                    activeLayout == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
                  }`}
                  onClick={() =>
                    updateDisplayFilters(projectId, {
                      layout: layout.key,
                    })
                  }
                >
                  <layout.icon
                    strokeWidth={2}
                    className={`h-3.5 w-3.5 ${
                      activeLayout == layout.key ? "text-custom-text-100" : "text-custom-text-200"
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
});
