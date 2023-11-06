import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
// ui
import { Breadcrumbs, LayersIcon } from "@plane/ui";
// types
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
// helper
import { renderEmoji } from "helpers/emoji.helper";

export const ProjectDraftIssueHeader: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { project: projectStore, draftIssueFilters: draftIssueFiltersStore } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const activeLayout = draftIssueFiltersStore.userDisplayFilters.layout;

  const handleLayoutChange = (layout: TIssueLayouts) => {
    if (!workspaceSlug || !projectId) return;

    draftIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        layout,
      },
    });
  };

  const handleFiltersUpdate = (key: keyof IIssueFilterOptions, value: string | string[]) => {
    if (!workspaceSlug || !projectId) return;

    const newValues = draftIssueFiltersStore.userFilters?.[key] ?? [];

    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (!newValues.includes(val)) newValues.push(val);
      });
    } else {
      if (draftIssueFiltersStore.userFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
      else newValues.push(value);
    }

    draftIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        [key]: newValues,
      },
    });
  };

  const handleDisplayFiltersUpdate = (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
    if (!workspaceSlug || !projectId) return;

    draftIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        ...updatedDisplayFilter,
      },
    });
  };

  const handleDisplayPropertiesUpdate = (property: Partial<IIssueDisplayProperties>) => {
    if (!workspaceSlug || !projectId) return;

    draftIssueFiltersStore.updateDisplayProperties(workspaceSlug.toString(), projectId.toString(), property);
  };

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={
                currentProjectDetails?.emoji ? (
                  renderEmoji(currentProjectDetails.emoji)
                ) : currentProjectDetails?.icon_prop ? (
                  renderEmoji(currentProjectDetails.icon_prop)
                ) : (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                    {currentProjectDetails?.name.charAt(0)}
                  </span>
                )
              }
              label={currentProjectDetails?.name ?? "Project"}
              link={`/${workspaceSlug}/projects`}
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
              label="Draft Issues"
            />
          </Breadcrumbs>
        </div>
      </div>

      {/* filter/layout/display options */}
      <div className="flex items-center gap-2">
        <LayoutSelection
          layouts={["list", "kanban"]}
          onChange={(layout) => handleLayoutChange(layout)}
          selectedLayout={activeLayout}
        />
        <FiltersDropdown title="Filters" placement="bottom-end">
          <FilterSelection
            filters={draftIssueFiltersStore.userFilters}
            handleFiltersUpdate={handleFiltersUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.draft_issues[activeLayout] : undefined
            }
            labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? undefined}
            members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
            states={projectStore.states?.[projectId?.toString() ?? ""] ?? undefined}
          />
        </FiltersDropdown>
        <FiltersDropdown title="Display" placement="bottom-end">
          <DisplayFiltersSelection
            displayFilters={draftIssueFiltersStore.userDisplayFilters}
            displayProperties={draftIssueFiltersStore.userDisplayProperties}
            handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
            handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.draft_issues[activeLayout] : undefined
            }
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
