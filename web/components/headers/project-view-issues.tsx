import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Breadcrumbs, BreadcrumbItem, CustomMenu, PhotoFilterIcon } from "@plane/ui";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
// helper
import { truncateText } from "helpers/string.helper";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const ProjectViewIssueHeader: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const {
    issueFilter: issueFilterStore,
    projectViewFilters: projectViewFiltersStore,
    projectViews: projectViewsStore,
    project: projectStore,
  } = useMobxStore();

  const views = projectId && viewId ? projectViewsStore.viewsList[projectId.toString()] : undefined;

  const viewDetails = viewId ? projectViewsStore.viewDetails[viewId.toString()] : undefined;

  const storedFilters = viewId ? projectViewFiltersStore.storedFilters[viewId.toString()] : undefined;

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          layout,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !viewId) return;

      const newValues = storedFilters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (storedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      projectViewFiltersStore.updateStoredFilters(viewId.toString(), {
        [key]: newValues,
      });
    },
    [projectViewFiltersStore, storedFilters, viewId, workspaceSlug]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          ...updatedDisplayFilter,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateDisplayProperties(workspaceSlug.toString(), projectId.toString(), property);
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div>
          <Breadcrumbs onBack={() => router.back()}>
            <span className="border-r-2 border-custom-sidebar-border-200 px-3 text-sm">
              <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Views`} />
            </span>
          </Breadcrumbs>
        </div>
        <CustomMenu
          label={
            <>
              <PhotoFilterIcon height={12} width={12} />
              {viewDetails?.name && truncateText(viewDetails.name, 40)}
            </>
          }
          className="ml-1.5"
          width="auto"
        >
          {views?.map((view) => (
            <CustomMenu.MenuItem
              key={view.id}
              onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/views/${view.id}`)}
            >
              {truncateText(view.name, 40)}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>
      <div className="flex items-center gap-2">
        <LayoutSelection
          layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
          onChange={(layout) => handleLayoutChange(layout)}
          selectedLayout={activeLayout}
        />
        <FiltersDropdown title="Filters">
          <FilterSelection
            filters={storedFilters ?? {}}
            handleFiltersUpdate={handleFiltersUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
            }
            labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? undefined}
            members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
            states={projectStore.states?.[projectId?.toString() ?? ""] ?? undefined}
          />
        </FiltersDropdown>
        <FiltersDropdown title="Display">
          <DisplayFiltersSelection
            displayFilters={issueFilterStore.userDisplayFilters}
            displayProperties={issueFilterStore.userDisplayProperties}
            handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
            handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
            }
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
