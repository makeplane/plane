"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { TViewFilterProps } from "@plane/types";
import { Header, EHeaderVariant } from "@plane/ui";
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { ProjectViewsList } from "@/components/views";
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
import { EmptyStateType } from "@/constants/empty-state";
// constants
import { EViewAccess } from "@/constants/views";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useProject, useProjectView } from "@/hooks/store";

const ProjectViewsPage = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const { getProjectById, currentProjectDetails } = useProject();
  const { filters, updateFilters, clearAllFilters } = useProjectView();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Views` : undefined;

  if (!workspaceSlug || !projectId) return <></>;

  // No access to
  if (currentProjectDetails?.issue_views_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState
          type={EmptyStateType.DISABLED_PROJECT_VIEW}
          primaryButtonLink={`/${workspaceSlug}/projects/${projectId}/settings/features`}
        />
      </div>
    );
  const handleRemoveFilter = useCallback(
    (key: keyof TViewFilterProps, value: string | EViewAccess | null) => {
      let newValues = filters.filters?.[key];

      if (key === "favorites") {
        newValues = !!value;
      }
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value) as string[];
      }

      updateFilters("filters", { [key]: newValues });
    },
    [filters.filters, updateFilters]
  );

  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;

  return (
    <>
      <PageHead title={pageTitle} />
      {isFiltersApplied && (
        <Header variant={EHeaderVariant.TERNARY}>
          <ViewAppliedFiltersList
            appliedFilters={filters.filters ?? {}}
            handleClearAllFilters={clearAllFilters}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </Header>
      )}
      <ProjectViewsList />
    </>
  );
});

export default ProjectViewsPage;
