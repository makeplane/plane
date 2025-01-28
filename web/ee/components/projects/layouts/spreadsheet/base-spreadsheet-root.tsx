import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useProject } from "@/hooks/store";
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
import { TProject } from "@/plane-web/types/projects";
import { EProjectLayouts, TProjectDisplayFilters } from "@/plane-web/types/workspace-project-filters";
import { SpreadsheetView } from "./spreadsheet-view";

export const BaseSpreadsheetRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks

  const { updateProject } = useProject();
  const { getFilteredProjectsByLayout, filters, bulkUpdateDisplayFilters } = useProjectFilter();

  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.TABLE);

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<TProjectDisplayFilters>) => {
      bulkUpdateDisplayFilters(workspaceSlug.toString(), {
        ...updatedDisplayFilter,
      });
    },
    [bulkUpdateDisplayFilters]
  );

  if (!Array.isArray(filteredProjectIds)) return null;

  return (
    <SpreadsheetView
      displayFilters={filters?.display_filters as TProjectDisplayFilters}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      projectIds={filteredProjectIds}
      updateProject={(projectId, data) =>
        updateProject(workspaceSlug.toString(), projectId || "", data) as Promise<TProject>
      }
      canEditProperties={() => true}
    />
  );
});
