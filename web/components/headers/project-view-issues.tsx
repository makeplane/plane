import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
// ui
import { Breadcrumbs, Button, CustomMenu, PhotoFilterIcon } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
import { EFilterType } from "store/issues/types";
import { EProjectStore } from "store/command-palette.store";
import { Plus } from "lucide-react";

export const ProjectViewIssuesHeader: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    viewId: string;
  };

  const {
    project: { currentProjectDetails },
    projectLabel: { projectLabels },
    projectMember: { projectMembers },
    projectState: projectStateStore,
    projectViews: projectViewsStore,
    viewIssuesFilter: { issueFilters, updateFilters },
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
  } = useMobxStore();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_FILTERS, { layout: layout }, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(workspaceSlug, projectId, EFilterType.FILTERS, { [key]: newValues }, viewId);
    },
    [workspaceSlug, projectId, viewId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_FILTERS, updatedDisplayFilter, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_PROPERTIES, property, viewId);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const viewsList = projectId ? projectViewsStore.viewsList[projectId.toString()] : undefined;
  const viewDetails = viewId ? projectViewsStore.viewDetails[viewId.toString()] : undefined;

  return (
    <div className="relative w-full flex items-center z-10 h-[3.75rem] justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2">
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            label={currentProjectDetails?.name ?? "Project"}
            icon={
              currentProjectDetails?.emoji ? (
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                  {renderEmoji(currentProjectDetails.emoji)}
                </span>
              ) : currentProjectDetails?.icon_prop ? (
                <div className="h-7 w-7 flex-shrink-0 grid place-items-center">
                  {renderEmoji(currentProjectDetails.icon_prop)}
                </div>
              ) : (
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                  {currentProjectDetails?.name.charAt(0)}
                </span>
              )
            }
            link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
          />
          <Breadcrumbs.BreadcrumbItem
            type="text"
            icon={<PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />}
            label="Views"
            link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/views`}
          />
          <Breadcrumbs.BreadcrumbItem
            type="component"
            component={
              <CustomMenu
                label={
                  <>
                    <PhotoFilterIcon height={12} width={12} />
                    {viewDetails?.name && truncateText(viewDetails.name, 40)}
                  </>
                }
                className="ml-1.5"
                placement="bottom-start"
              >
                {viewsList?.map((view) => (
                  <CustomMenu.MenuItem
                    key={view.id}
                    onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/views/${view.id}`)}
                  >
                    {truncateText(view.name, 40)}
                  </CustomMenu.MenuItem>
                ))}
              </CustomMenu>
            }
          />
        </Breadcrumbs>
      </div>
      <div className="flex items-center gap-2">
        <LayoutSelection
          layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
          onChange={(layout) => handleLayoutChange(layout)}
          selectedLayout={activeLayout}
        />
        <FiltersDropdown title="Filters" placement="bottom-end">
          <FilterSelection
            filters={issueFilters?.filters ?? {}}
            handleFiltersUpdate={handleFiltersUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
            }
            labels={projectLabels ?? undefined}
            members={projectMembers?.map((m) => m.member)}
            states={projectStateStore.states?.[projectId ?? ""] ?? undefined}
          />
        </FiltersDropdown>
        <FiltersDropdown title="Display" placement="bottom-end">
          <DisplayFiltersSelection
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
            }
            displayFilters={issueFilters?.displayFilters ?? {}}
            handleDisplayFiltersUpdate={handleDisplayFilters}
            displayProperties={issueFilters?.displayProperties ?? {}}
            handleDisplayPropertiesUpdate={handleDisplayProperties}
          />
        </FiltersDropdown>
        <Button
          onClick={() => {
            setTrackElement("PROJECT_VIEW_PAGE_HEADER");
            commandPaletteStore.toggleCreateIssueModal(true, EProjectStore.PROJECT_VIEW);
          }}
          size="sm"
          prependIcon={<Plus />}
        >
          Add Issue
        </Button>
      </div>
    </div>
  );
});
