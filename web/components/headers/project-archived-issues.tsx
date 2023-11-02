import { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { Breadcrumbs, BreadcrumbItem } from "@plane/ui";
// icons
import { ArrowLeft } from "lucide-react";
// components
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "components/issues";
// types
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "types";

export const ProjectArchivedIssuesHeader: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { project: projectStore, archivedIssueFilters: archivedIssueFiltersStore } = useMobxStore();

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

  // for archived issues list layout is the only option
  const activeLayout = "list";

  const handleFiltersUpdate = (key: keyof IIssueFilterOptions, value: string | string[]) => {
    if (!workspaceSlug || !projectId) return;

    const newValues = archivedIssueFiltersStore.userFilters?.[key] ?? [];

    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (!newValues.includes(val)) newValues.push(val);
      });
    } else {
      if (archivedIssueFiltersStore.userFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
      else newValues.push(value);
    }

    archivedIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        [key]: newValues,
      },
    });
  };

  const handleDisplayFiltersUpdate = (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
    if (!workspaceSlug || !projectId) return;

    console.log(updatedDisplayFilter);

    archivedIssueFiltersStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        ...archivedIssueFiltersStore.userDisplayFilters,
        ...updatedDisplayFilter,
      },
    });
  };

  const handleDisplayPropertiesUpdate = (property: Partial<IIssueDisplayProperties>) => {
    if (!workspaceSlug || !projectId) return;

    archivedIssueFiltersStore.updateDisplayProperties(workspaceSlug.toString(), projectId.toString(), property);
  };

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div className="block md:hidden">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
            onClick={() => router.back()}
          >
            <ArrowLeft fontSize={14} strokeWidth={2} />
          </button>
        </div>
        <div>
          <Breadcrumbs onBack={() => router.back()}>
            <BreadcrumbItem
              link={
                <Link href={`/${workspaceSlug}/projects`}>
                  <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                    <p>Projects</p>
                  </a>
                </Link>
              }
            />
            <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Issues`} />
          </Breadcrumbs>
        </div>
      </div>

      {/* filter options */}
      <div className="flex items-center gap-2">
        <FiltersDropdown title="Filters" placement="bottom-end">
          <FilterSelection
            filters={archivedIssueFiltersStore.userFilters}
            handleFiltersUpdate={handleFiltersUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.archived_issues[activeLayout] : undefined
            }
            labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? undefined}
            members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
            states={projectStore.states?.[projectId?.toString() ?? ""] ?? undefined}
          />
        </FiltersDropdown>
        <FiltersDropdown title="Display" placement="bottom-end">
          <DisplayFiltersSelection
            displayFilters={archivedIssueFiltersStore.userDisplayFilters}
            displayProperties={archivedIssueFiltersStore.userDisplayProperties}
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
