"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { TViewFilterProps } from "@plane/types";
import { Breadcrumbs, PhotoFilterIcon, Button } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { ViewListHeader } from "@/components/views";
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
// constants
import { EUserProjectRoles } from "@/constants/project";
import { EViewAccess } from "@/constants/views";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useCommandPalette, useProject, useProjectView, useUser } from "@/hooks/store";

export const ProjectViewsHeader = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, loader } = useProject();
  const { filters, updateFilters, clearAllFilters } = useProjectView();

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

  const canUserCreateView =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <>
      <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <div>
            <Breadcrumbs isLoading={loader}>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                    label={currentProjectDetails?.name ?? "Project"}
                    icon={
                      currentProjectDetails && (
                        <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                          <Logo logo={currentProjectDetails?.logo_props} size={16} />
                        </span>
                      )
                    }
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink label="Views" icon={<PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />} />
                }
              />
            </Breadcrumbs>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <ViewListHeader />
          {canUserCreateView && (
            <div>
              <Button variant="primary" size="sm" onClick={() => toggleCreateViewModal(true)}>
                Add View
              </Button>
            </div>
          )}
        </div>
      </div>
      {isFiltersApplied && (
        <div className="border-t border-custom-border-200 px-5 py-3">
          <ViewAppliedFiltersList
            appliedFilters={filters.filters ?? {}}
            handleClearAllFilters={clearAllFilters}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </div>
      )}
    </>
  );
});
