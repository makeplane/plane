import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListFilter } from "lucide-react";
// types
import { cn } from "@plane/editor";
import { TProjectFilters } from "@plane/types";
// components
import { FiltersDropdown } from "@/components/issues";
import { ProjectFiltersSelection, ProjectOrderByDropdown } from "@/components/project";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useMember, useProjectFilter } from "@/hooks/store";

type Props = {
  filterMenuButton?: React.ReactNode;
  classname?: string;
  filterClassname?: string;
  isMobile?: boolean;
};

const HeaderFilters = observer(({ filterMenuButton, isMobile, classname = "", filterClassname = "" }: Props) => {
  // router
  const { workspaceSlug } = useParams();
  const {
    currentWorkspaceDisplayFilters: displayFilters,
    currentWorkspaceFilters: filters,
    updateFilters,
    updateDisplayFilters,
  } = useProjectFilter();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
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

      updateFilters(workspaceSlug.toString(), { [key]: newValues });
    },
    [filters, updateFilters, workspaceSlug]
  );
  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0;

  return (
    <div className={cn("flex gap-3", classname)}>
      <ProjectOrderByDropdown
        value={displayFilters?.order_by}
        onChange={(val) => {
          if (!workspaceSlug || val === displayFilters?.order_by) return;
          updateDisplayFilters(workspaceSlug.toString(), {
            order_by: val,
          });
        }}
        isMobile={isMobile}
      />
      <div className={cn(filterClassname)}>
        <FiltersDropdown
          icon={<ListFilter className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={isFiltersApplied}
          menuButton={filterMenuButton || null}
        >
          <ProjectFiltersSelection
            displayFilters={displayFilters ?? {}}
            filters={filters ?? {}}
            handleFiltersUpdate={handleFilters}
            handleDisplayFiltersUpdate={(val) => {
              if (!workspaceSlug) return;
              updateDisplayFilters(workspaceSlug.toString(), val);
            }}
            memberIds={workspaceMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
export default HeaderFilters;
