import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { ProjectAnalyticsModal } from "components/analytics";
// ui
import { Breadcrumbs, Button, CustomMenu, DiceIcon } from "@plane/ui";
// icons
import { ArrowRight, ContrastIcon, Plus } from "lucide-react";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
import { EFilterType } from "store/issues/types";
import { EProjectStore } from "store/command-palette.store";

export const ModuleIssuesHeader: React.FC = observer(() => {
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };

  const {
    module: moduleStore,
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
    projectLabel: { projectLabels },
    moduleIssuesFilter: { issueFilters, updateFilters },
  } = useMobxStore();

  const { currentProjectDetails } = projectStore;

  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");

  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_FILTERS, { layout: layout }, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
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

      updateFilters(workspaceSlug, projectId, EFilterType.FILTERS, { [key]: newValues }, moduleId);
    },
    [workspaceSlug, projectId, moduleId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_FILTERS, updatedDisplayFilter, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_PROPERTIES, property, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
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
      <div className="relative z-10 flex h-[3.75rem] w-full items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex items-center gap-2">
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
              link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />}
              label="Modules"
              link={`/${workspaceSlug}/projects/${projectId}/modules`}
            />
            <Breadcrumbs.BreadcrumbItem
              type="component"
              component={
                <CustomMenu
                  label={
                    <>
                      <ContrastIcon className="h-3 w-3" />
                      {moduleDetails?.name && truncateText(moduleDetails.name, 40)}
                    </>
                  }
                  className="ml-1.5 flex-shrink-0"
                  width="auto"
                  placement="bottom-start"
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
          <Button onClick={() => setAnalyticsModal(true)} variant="neutral-primary" size="sm">
            Analytics
          </Button>
          <Button
            onClick={() => {
              setTrackElement("MODULE_PAGE_HEADER");
              commandPaletteStore.toggleCreateIssueModal(true, EProjectStore.MODULE);
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
