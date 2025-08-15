"use client";

import { FC, useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// plane web components
import { usePathname, useSearchParams } from "next/navigation";
import { useProject } from "@/hooks/store/use-project";
import { ProjectLayoutRoot } from "@/plane-web/components/projects";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import {
  EProjectFilters,
  EProjectScope,
  TProjectFilters,
  TProjectAttributes,
} from "@/plane-web/types/workspace-project-filters";
import { ProjectAppliedFiltersList } from "./applied-filters";

type TWorkspaceProjectsRoot = {
  workspaceSlug: string;
  workspaceId: string;
  isArchived?: boolean;
  filtersToInit?: EProjectFilters[];
};

export const WorkspaceProjectsRoot: FC<TWorkspaceProjectsRoot> = observer((props) => {
  const { workspaceSlug, isArchived = false, filtersToInit: filtersToInitFromProps = [] } = props;
  //pathname
  const pathname = usePathname();
  // hooks
  const {
    initWorkspaceFilters,
    appliedAttributesCount,
    filters,
    filteredProjectIds,
    clearAllFilters,
    updateAttributes,
    scopeProjectsCount,
  } = useProjectFilter();

  const searchParams = useSearchParams();
  const showAllProjects = searchParams.get("show-all-projects");
  const { loader } = useProject();

  // derived values
  const selectedScope = filters?.scope;
  const selectedScopeCount = selectedScope && scopeProjectsCount?.[selectedScope];
  const allProjectCount = scopeProjectsCount[EProjectScope.ALL_PROJECTS];

  useEffect(() => {
    if (workspaceSlug) {
      let filtersToInit = [EProjectFilters.LAYOUT, EProjectFilters.ATTRIBUTES, EProjectFilters.DISPLAY_FILTERS];
      filtersToInit = loader === "init-loader" ? filtersToInit : [EProjectFilters.SCOPE, ...filtersToInit];
      if (filtersToInitFromProps.length > 0) {
        filtersToInit = filtersToInitFromProps;
      }
      initWorkspaceFilters(
        workspaceSlug,
        typeof showAllProjects === "string"
          ? showAllProjects === "true"
            ? EProjectScope.ALL_PROJECTS
            : EProjectScope.MY_PROJECTS
          : undefined,
        filtersToInit,
        isArchived
      );
    }
  }, [workspaceSlug, initWorkspaceFilters, pathname, showAllProjects, loader, isArchived, filtersToInitFromProps]);

  const handleClearAllFilters = useCallback(() => {
    if (!workspaceSlug) return;
    clearAllFilters(workspaceSlug, isArchived);
  }, [clearAllFilters, isArchived, workspaceSlug]);

  // TProjectAttributes has arrays of different types, value is an element of that array
  const handleRemoveFilter = useCallback(
    <T extends keyof TProjectAttributes>(key: T, value: any) => {
      if (!workspaceSlug || !filters) return;

      if (!value) {
        updateAttributes(workspaceSlug, key, [] as unknown as TProjectAttributes[T], isArchived);
        return;
      }

      let newValues = filters.attributes[key];
      if (Array.isArray(newValues)) {
        newValues = newValues.filter((val) => val !== value) as TProjectAttributes[T];
        updateAttributes(workspaceSlug, key, newValues, isArchived);
      } else if (typeof value === "boolean") {
        updateAttributes(workspaceSlug, "archived", !value, isArchived);
      }
    },
    [filters, isArchived, updateAttributes, workspaceSlug]
  );

  return (
    <div className="flex h-full w-full flex-col">
      {appliedAttributesCount > 0 && (
        <ProjectAppliedFiltersList
          appliedFilters={filters ?? ({} as TProjectFilters)}
          handleClearAllFilters={handleClearAllFilters}
          filteredProjects={filteredProjectIds?.length ?? 0}
          totalProjects={selectedScopeCount ?? allProjectCount}
          handleRemoveFilter={handleRemoveFilter}
          alwaysAllowEditing
        />
      )}
      <ProjectLayoutRoot />
    </div>
  );
});
