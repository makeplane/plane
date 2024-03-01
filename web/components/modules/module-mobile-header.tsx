import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { ProjectAnalyticsModal } from "components/analytics";
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "components/issues";
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT, ISSUE_LAYOUTS } from "constants/issue";
import { useIssues, useLabel, useMember, useModule, useProjectState } from "hooks/store";
import { Calendar, ChevronDown, Kanban, List } from "lucide-react";
import router from "next/router";
import { useCallback, useState } from "react";

export const ModuleMobileHeader = () => {
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const { getModuleById } = useModule();
  const layouts = [
    { key: "list", title: "List", icon: List },
    { key: "kanban", title: "Kanban", icon: Kanban },
    { key: "calendar", title: "Calendar", icon: Calendar },
  ];
  const { workspaceSlug, projectId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    moduleId: string;
  };
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;

  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.MODULE);
  const activeLayout = issueFilters?.displayFilters?.layout;
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, moduleId);
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

      updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { [key]: newValues }, moduleId);
    },
    [workspaceSlug, projectId, moduleId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property, moduleId);
    },
    [workspaceSlug, projectId, moduleId, updateFilters]
  );

  return (
    <div className="block md:hidden">
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
      />
      <div className="flex justify-evenly py-2 border-b border-custom-border-200">
        <CustomMenu
          maxHeight={"md"}
          className="flex flex-grow justify-center text-custom-text-200 text-sm"
          placement="bottom-start"
          customButton={<span className="flex flex-grow justify-center text-custom-text-200 text-sm">Layout</span>}
          customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
          closeOnSelect
        >
          {layouts.map((layout, index) => (
            <CustomMenu.MenuItem
              onClick={() => {
                handleLayoutChange(ISSUE_LAYOUTS[index].key);
              }}
              className="flex items-center gap-2"
            >
              <layout.icon className="w-3 h-3" />
              <div className="text-custom-text-300">{layout.title}</div>
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
        <div className="flex flex-grow justify-center border-l border-custom-border-200 items-center text-custom-text-200 text-sm">
          <FiltersDropdown
            title="Filters"
            placement="bottom-end"
            menuButton={
              <span className="flex items-center text-custom-text-200 text-sm">
                Filters
                <ChevronDown className="text-custom-text-200  h-4 w-4 ml-2" />
              </span>
            }
          >
            <FilterSelection
              filters={issueFilters?.filters ?? {}}
              handleFiltersUpdate={handleFiltersUpdate}
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              labels={projectLabels}
              memberIds={projectMemberIds ?? undefined}
              states={projectStates}
            />
          </FiltersDropdown>
        </div>
        <div className="flex flex-grow justify-center border-l border-custom-border-200 items-center text-custom-text-200 text-sm">
          <FiltersDropdown
            title="Display"
            placement="bottom-end"
            menuButton={
              <span className="flex items-center text-custom-text-200 text-sm">
                Display
                <ChevronDown className="text-custom-text-200 h-4 w-4 ml-2" />
              </span>
            }
          >
            <DisplayFiltersSelection
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              displayFilters={issueFilters?.displayFilters ?? {}}
              handleDisplayFiltersUpdate={handleDisplayFilters}
              displayProperties={issueFilters?.displayProperties ?? {}}
              handleDisplayPropertiesUpdate={handleDisplayProperties}
              ignoreGroupedFilters={["module"]}
            />
          </FiltersDropdown>
        </div>

        <button
          onClick={() => setAnalyticsModal(true)}
          className="flex flex-grow justify-center text-custom-text-200 text-sm border-l border-custom-border-200"
        >
          Analytics
        </button>
      </div>
    </div>
  );
};
