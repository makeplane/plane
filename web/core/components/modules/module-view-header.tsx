"use client";

import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { ListFilter, Search, X } from "lucide-react";
// helpers
import { cn } from "@plane/editor";
// types
import { TModuleFilters } from "@plane/types";
// ui
import { Tooltip } from "@plane/ui";
// components
import { FiltersDropdown } from "@/components/issues";
import { ModuleFiltersSelection, ModuleOrderByDropdown } from "@/components/modules/dropdowns";
// constants
import { MODULE_VIEW_LAYOUTS } from "@/constants/module";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useMember, useModuleFilter } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const ModuleViewHeader: FC = observer(() => {
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // router
  const { projectId } = useParams();
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const {
    currentProjectDisplayFilters: displayFilters,
    currentProjectFilters: filters,
    searchQuery,
    updateDisplayFilters,
    updateFilters,
    updateSearchQuery,
  } = useModuleFilter();

  // states
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "" ? true : false);

  // handlers
  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = filters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), { [key]: newValues });
    },
    [filters, projectId, updateFilters]
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

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [searchQuery]);

  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0 || displayFilters?.favorites;

  return (
    <div className="hidden h-full sm:flex items-center gap-3 self-end">
      <div className="flex items-center">
        {!isSearchOpen && (
          <button
            type="button"
            className="-mr-1 p-2 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
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
                // updateSearchQuery("");
                setIsSearchOpen(false);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <ModuleOrderByDropdown
        value={displayFilters?.order_by}
        onChange={(val) => {
          if (!projectId || val === displayFilters?.order_by) return;
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
          displayFilters={displayFilters ?? {}}
          filters={filters ?? {}}
          handleDisplayFiltersUpdate={(val) => {
            if (!projectId) return;
            updateDisplayFilters(projectId.toString(), val);
          }}
          handleFiltersUpdate={handleFilters}
          memberIds={workspaceMemberIds ?? undefined}
        />
      </FiltersDropdown>
      <div className="hidden md:flex items-center gap-1 rounded bg-custom-background-80 p-1">
        {MODULE_VIEW_LAYOUTS.map((layout) => (
          <Tooltip key={layout.key} tooltipContent={layout.title} isMobile={isMobile}>
            <button
              type="button"
              className={cn(
                "group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100",
                {
                  "bg-custom-background-100 shadow-custom-shadow-2xs": displayFilters?.layout === layout.key,
                }
              )}
              onClick={() => {
                if (!projectId) return;
                updateDisplayFilters(projectId.toString(), { layout: layout.key });
              }}
            >
              <layout.icon
                strokeWidth={2}
                className={cn("h-3.5 w-3.5 text-custom-text-200", {
                  "text-custom-text-100": displayFilters?.layout === layout.key,
                })}
              />
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
});
