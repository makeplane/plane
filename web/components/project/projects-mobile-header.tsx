import { useCallback } from "react";
import { observer } from "mobx-react";
// icons
import { ChevronDown, ListFilter } from "lucide-react";
// types
import { TProjectFilters } from "@plane/types";
// hooks
import { FiltersDropdown } from "@/components/issues/issue-layouts";
import { ProjectFiltersSelection, ProjectOrderByDropdown } from "@/components/project/dropdowns";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useAppRouter, useMember, useProjectFilter } from "@/hooks/store";

const ProjectsMobileHeader = observer(() => {
  const {
    currentWorkspaceDisplayFilters: displayFilters,
    currentWorkspaceFilters: filters,
    updateDisplayFilters,
    updateFilters,
  } = useProjectFilter();

  const { workspaceSlug } = useAppRouter();

  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  const handleFilters = useCallback(
    (key: keyof TProjectFilters, value: string | string[]) => {
      if (!workspaceSlug) return;
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
      updateFilters(workspaceSlug, { [key]: newValues });
    },
    [filters, updateFilters, workspaceSlug]
  );

  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0;

  return (
    <div className="flex py-2 border-b border-custom-border-200 md:hidden bg-custom-background-100 w-full">
      <ProjectOrderByDropdown
        value={displayFilters?.order_by}
        onChange={(val) => {
          if (!workspaceSlug || val === displayFilters?.order_by) return;
          updateDisplayFilters(workspaceSlug, {
            order_by: val,
          });
        }}
        isMobile
      />
      <div className="border-l border-custom-border-200 flex justify-around w-full">
        <FiltersDropdown
          icon={<ListFilter className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          menuButton={
            <div className="flex text-sm items-center gap-2 neutral-primary text-custom-text-200">
              <ListFilter className="h-3 w-3" />
              Filters
              <ChevronDown className="h-3 w-3" strokeWidth={2} />
            </div>
          }
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
    </div>
  );
});

export default ProjectsMobileHeader;
