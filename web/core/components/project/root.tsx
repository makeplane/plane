"use client";

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// types
import { useParams, usePathname } from "next/navigation";
import { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
// components
import { CustomHeader, EHeaderVariant } from "@plane/ui";
import { PageHead } from "@/components/core";
import { ProjectAppliedFiltersList, ProjectCardList } from "@/components/project";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useProject, useProjectFilter, useWorkspace } from "@/hooks/store";

const Root = observer(() => {
  const { currentWorkspace } = useWorkspace();
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store
  const { totalProjectIds, filteredProjectIds } = useProject();
  const {
    currentWorkspaceFilters,
    currentWorkspaceAppliedDisplayFilters,
    clearAllFilters,
    clearAllAppliedDisplayFilters,
    updateFilters,
    updateDisplayFilters,
  } = useProjectFilter();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Projects` : undefined;

  const handleRemoveFilter = useCallback(
    (key: keyof TProjectFilters, value: string | null) => {
      if (!workspaceSlug) return;
      let newValues = currentWorkspaceFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(workspaceSlug.toString(), { [key]: newValues });
    },
    [currentWorkspaceFilters, updateFilters, workspaceSlug]
  );

  const handleRemoveDisplayFilter = useCallback(
    (key: TProjectAppliedDisplayFilterKeys) => {
      if (!workspaceSlug) return;
      updateDisplayFilters(workspaceSlug.toString(), { [key]: false });
    },
    [updateDisplayFilters, workspaceSlug]
  );

  const handleClearAllFilters = useCallback(() => {
    if (!workspaceSlug) return;
    clearAllFilters(workspaceSlug.toString());
    clearAllAppliedDisplayFilters(workspaceSlug.toString());
  }, [clearAllFilters, clearAllAppliedDisplayFilters, workspaceSlug]);

  useEffect(() => {
    if (pathname.includes("/archives")) {
      updateDisplayFilters(workspaceSlug.toString(), { archived_projects: true });
    } else {
      updateDisplayFilters(workspaceSlug.toString(), { archived_projects: false });
    }
  }, [pathname]);
  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">
        {(calculateTotalFilters(currentWorkspaceFilters ?? {}) !== 0 ||
          currentWorkspaceAppliedDisplayFilters?.length !== 0) && (
          <CustomHeader variant={EHeaderVariant.ternary}>
            <ProjectAppliedFiltersList
              appliedFilters={currentWorkspaceFilters ?? {}}
              appliedDisplayFilters={currentWorkspaceAppliedDisplayFilters ?? []}
              handleClearAllFilters={handleClearAllFilters}
              handleRemoveFilter={handleRemoveFilter}
              handleRemoveDisplayFilter={handleRemoveDisplayFilter}
              filteredProjects={filteredProjectIds?.length ?? 0}
              totalProjects={totalProjectIds?.length ?? 0}
              alwaysAllowEditing
            />
          </CustomHeader>
        )}
        <ProjectCardList />
      </div>
    </>
  );
});

export default Root;
