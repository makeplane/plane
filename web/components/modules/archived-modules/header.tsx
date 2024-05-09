import { FC, useCallback, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// icons
import { ListFilter, Search, X } from "lucide-react";
// types
import type { TModuleFilters } from "@plane/types";
// components
import { ArchiveTabsList } from "@/components/archives";
import { FiltersDropdown } from "@/components/issues";
import { ModuleFiltersSelection, ModuleOrderByDropdown } from "@/components/modules";
// helpers
import { cn } from "@/helpers/common.helper";
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useMember, useModuleFilter } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

export const ArchivedModulesHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { projectId } = router.query;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // hooks
  const {
    currentProjectArchivedFilters,
    currentProjectDisplayFilters,
    archivedModulesSearchQuery,
    updateFilters,
    updateDisplayFilters,
    updateArchivedModulesSearchQuery,
  } = useModuleFilter();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(archivedModulesSearchQuery !== "" ? true : false);
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && archivedModulesSearchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = currentProjectArchivedFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (currentProjectArchivedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), { [key]: newValues }, "archived");
    },
    [currentProjectArchivedFilters, projectId, updateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (archivedModulesSearchQuery && archivedModulesSearchQuery.trim() !== "") updateArchivedModulesSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  const isFiltersApplied = calculateTotalFilters(currentProjectArchivedFilters ?? {}) !== 0;

  return (
    <div className="group relative flex border-b border-custom-border-200">
      <div className="flex w-full items-center overflow-x-auto px-4 gap-2 horizontal-scrollbar scrollbar-sm">
        <ArchiveTabsList />
      </div>
      {/* filter options */}
      <div className="h-full flex items-center gap-3 self-end px-8">
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
            value={archivedModulesSearchQuery}
            onChange={(e) => updateArchivedModulesSearchQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {isSearchOpen && (
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => {
                updateArchivedModulesSearchQuery("");
                setIsSearchOpen(false);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <ModuleOrderByDropdown
          value={currentProjectDisplayFilters?.order_by}
          onChange={(val) => {
            if (!projectId || val === currentProjectDisplayFilters?.order_by) return;
            updateDisplayFilters(projectId.toString(), {
              order_by: val,
            });
          }}
        />
        <FiltersDropdown
          icon={<ListFilter className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={isFiltersApplied}
        >
          <ModuleFiltersSelection
            displayFilters={currentProjectDisplayFilters ?? {}}
            filters={currentProjectArchivedFilters ?? {}}
            handleDisplayFiltersUpdate={(val) => {
              if (!projectId) return;
              updateDisplayFilters(projectId.toString(), val);
            }}
            handleFiltersUpdate={handleFilters}
            memberIds={workspaceMemberIds ?? undefined}
            isArchived
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
