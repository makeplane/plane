import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Search, Briefcase, X, ListFilter } from "lucide-react";
// types
import { TProjectFilters } from "@plane/types";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { FiltersDropdown } from "@/components/issues";
import { ProjectFiltersSelection, ProjectOrderByDropdown } from "@/components/project";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useAppRouter, useCommandPalette, useEventTracker, useMember, useProjectFilter, useUser } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

export const ProjectsHeader = observer(() => {
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { workspaceSlug } = useAppRouter();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const {
    currentWorkspaceDisplayFilters: displayFilters,
    currentWorkspaceFilters: filters,
    updateFilters,
    updateDisplayFilters,
    searchQuery,
    updateSearchQuery,
  } = useProjectFilter();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });
  // auth
  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  const handleFilters = useCallback(
    (key: keyof TProjectFilters, value: string | string[]) => {
      if (!workspaceSlug) return;
      let newValues = filters?.[key] ?? [];
      if (Array.isArray(value)) {
        if (key === "created_at" && newValues.find((v) => v.includes("custom"))) newValues = [];
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else {
          if (key === "created_at") newValues = [value];
          else newValues.push(value);
        }
      }

      updateFilters(workspaceSlug, { [key]: newValues });
    },
    [filters, updateFilters, workspaceSlug]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else setIsSearchOpen(false);
    }
  };

  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0;

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Projects" icon={<Briefcase className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </div>
      <div className="w-full flex items-center justify-end gap-3">
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
                "w-30 md:w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
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
        </div>
        <div className="hidden md:flex gap-3">
          <ProjectOrderByDropdown
            value={displayFilters?.order_by}
            onChange={(val) => {
              if (!workspaceSlug || val === displayFilters?.order_by) return;
              updateDisplayFilters(workspaceSlug, {
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
            <ProjectFiltersSelection
              displayFilters={displayFilters ?? {}}
              filters={filters ?? {}}
              handleFiltersUpdate={handleFilters}
              handleDisplayFiltersUpdate={(val) => {
                if (!workspaceSlug) return;
                updateDisplayFilters(workspaceSlug, val);
              }}
              memberIds={workspaceMemberIds ?? undefined}
            />
          </FiltersDropdown>
        </div>
        {isAuthorizedUser && (
          <Button
            size="sm"
            onClick={() => {
              setTrackElement("Projects page");
              toggleCreateProjectModal(true);
            }}
            className="items-center gap-1"
          >
            <span className="hidden sm:inline-block">Add</span> Project
          </Button>
        )}
      </div>
    </div>
  );
});
