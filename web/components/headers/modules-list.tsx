import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { ListFilter, Plus, Search, X } from "lucide-react";
import { TModuleFilters } from "@plane/types";
// hooks
import { Breadcrumbs, Button, Tooltip, DiceIcon } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common";
import { FiltersDropdown } from "@/components/issues";
import { ModuleFiltersSelection, ModuleOrderByDropdown } from "@/components/modules";
import { ProjectLogo } from "@/components/project";
import { MODULE_VIEW_LAYOUTS } from "@/constants/module";
import { EUserProjectRoles } from "@/constants/project";
import { cn } from "@/helpers/common.helper";
import { useApplication, useEventTracker, useMember, useModuleFilter, useProject, useUser } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// components
// constants
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// ui
// helpers
// types

export const ModulesListHeader: React.FC = observer(() => {
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { isMobile } = usePlatformOS();
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
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = filters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
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

  // auth
  const canUserCreateModule =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs onBack={router.back}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Modules" icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </div>
      <div className="flex items-center gap-2">
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
        <ModuleOrderByDropdown
          value={displayFilters?.order_by}
          onChange={(val) => {
            if (!projectId || val === displayFilters?.order_by) return;
            updateDisplayFilters(projectId.toString(), {
              order_by: val,
            });
          }}
        />
        <FiltersDropdown icon={<ListFilter className="h-3 w-3" />} title="Filters" placement="bottom-end">
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
        {canUserCreateModule && (
          <Button
            variant="primary"
            size="sm"
            prependIcon={<Plus />}
            onClick={() => {
              setTrackElement("Modules page");
              commandPaletteStore.toggleCreateModuleModal(true);
            }}
          >
            <div className="hidden sm:block">Add</div> Module
          </Button>
        )}
      </div>
    </div>
  );
});
