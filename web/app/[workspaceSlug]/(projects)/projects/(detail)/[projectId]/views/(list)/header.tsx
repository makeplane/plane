"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
// ui
import { TViewFilterProps } from "@plane/types";
import { Breadcrumbs, Button } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { HeaderContainer } from "@/components/containers";
import { ViewListHeader } from "@/components/views";
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
// constants
import { EViewAccess } from "@/constants/views";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useCommandPalette, useProject, useProjectView } from "@/hooks/store";

export const ProjectViewsHeader = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
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

  return (
    <>
      <HeaderContainer>
        <HeaderContainer.LeftItem>
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
              link={<BreadcrumbLink label="Views" icon={<Layers className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </HeaderContainer.LeftItem>
        <HeaderContainer.RightItem>
          <ViewListHeader />
          <div>
            <Button variant="primary" size="sm" onClick={() => toggleCreateViewModal(true)}>
              Add view
            </Button>
          </div>
        </HeaderContainer.RightItem>
      </HeaderContainer>
      {isFiltersApplied && (
        <div className="border-t border-custom-border-200 p-page-x py-3">
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
