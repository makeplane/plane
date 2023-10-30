import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { ProjectAnalyticsModal } from "components/analytics";
// ui
import { Breadcrumbs, Button, CustomMenu } from "@plane/ui";
// icons
import { ArrowRight, ContrastIcon, Plus } from "lucide-react";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const ModuleIssuesHeader: React.FC = observer(() => {
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const {
    issueFilter: issueFilterStore,
    module: moduleStore,
    moduleFilter: moduleFilterStore,
    project: projectStore,
  } = useMobxStore();
  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");

  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

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
      if (!workspaceSlug || !projectId || !moduleId) return;

      const newValues = moduleFilterStore.moduleFilters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (moduleFilterStore.moduleFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      moduleFilterStore.updateModuleFilters(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), {
        [key]: newValues,
      });
    },
    [moduleId, moduleFilterStore, projectId, workspaceSlug]
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

  const modulesList = projectId ? moduleStore.modules[projectId.toString()] : undefined;
  const moduleDetails = moduleId ? moduleStore.getModuleById(moduleId.toString()) : undefined;

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
      />
      <div className="relative w-full flex items-center z-10 justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex items-center gap-2">
          <Breadcrumbs onBack={() => router.back()}>
            <Breadcrumbs.BreadcrumbItem
              link={
                <Link href={`/${workspaceSlug}/projects/${projectId}/modules`}>
                  <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                    <p className="truncate">{`${truncateText(
                      moduleDetails?.project_detail.name ?? "",
                      32
                    )} Modules`}</p>
                  </a>
                </Link>
              }
            />
          </Breadcrumbs>
          <CustomMenu
            label={
              <>
                <ContrastIcon className="h-3 w-3" />
                {moduleDetails?.name && truncateText(moduleDetails.name, 40)}
              </>
            }
            className="ml-1.5 flex-shrink-0"
            width="auto"
          >
            {modulesList?.map((module) => (
              <CustomMenu.MenuItem
                key={module.id}
                onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/modules/${module.id}`)}
              >
                {truncateText(module.name, 40)}
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
          <FiltersDropdown title="Filters" placement="bottom-end">
            <FilterSelection
              filters={moduleFilterStore.moduleFilters}
              handleFiltersUpdate={handleFiltersUpdate}
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? undefined}
              members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
              states={projectStore.states?.[projectId?.toString() ?? ""] ?? undefined}
            />
          </FiltersDropdown>
          <FiltersDropdown title="Display" placement="bottom-end">
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
          <Button onClick={() => setAnalyticsModal(true)} variant="neutral-primary" size="sm">
            Analytics
          </Button>
          <Button
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "c",
              });
              document.dispatchEvent(e);
            }}
            size="sm"
            prependIcon={<Plus />}
          >
            Add Issue
          </Button>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80"
            onClick={toggleSidebar}
          >
            <ArrowRight className={`h-4 w-4 duration-300 ${isSidebarCollapsed ? "-rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </>
  );
});
