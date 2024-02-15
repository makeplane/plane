import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import router from "next/router";
// components
import { CustomMenu } from "@plane/ui";
// icons
import { Calendar, ChevronDown, GanttChartSquare, Kanban, List, Sheet } from "lucide-react";
// constants
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT, ISSUE_LAYOUTS } from "constants/issue";
// hooks
import { useIssues, useLabel, useMember, useProject, useProjectState } from "hooks/store";
// layouts
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "./issue-layouts";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
import { ProjectAnalyticsModal } from "components/analytics";

export const IssuesMobileHeader = observer(() => {
    const layouts = [
        { key: "list", title: "List view", icon: List },
        { key: "kanban", title: "Kanban view", icon: Kanban },
        { key: "calendar", title: "Calendar view", icon: Calendar },
        { key: "spreadsheet", title: "Spreadsheet view", icon: Sheet },
        { key: "gantt_chart", title: "Gantt view", icon: GanttChartSquare },
    ];
    const [analyticsModal, setAnalyticsModal] = useState(false);
    const { workspaceSlug, projectId } = router.query as {
        workspaceSlug: string;
        projectId: string;
    };
    const { currentProjectDetails } = useProject();
    const { projectStates } = useProjectState();
    const { projectLabels } = useLabel();

    // store hooks
    const {
        issuesFilter: { issueFilters, updateFilters },
    } = useIssues(EIssuesStoreType.PROJECT);
    const {
        project: { projectMemberIds },
    } = useMember();
    const activeLayout = issueFilters?.displayFilters?.layout;

    const showCurrentIcon = layouts.find(layout => layout.key === activeLayout);


    const handleLayoutChange = useCallback(
        (layout: TIssueLayouts) => {
            if (!workspaceSlug || !projectId) return;
            updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
        },
        [workspaceSlug, projectId, updateFilters]
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

            updateFilters(workspaceSlug, projectId, EIssueFilterType.FILTERS, { [key]: newValues });
        },
        [workspaceSlug, projectId, issueFilters, updateFilters]
    );

    const handleDisplayFilters = useCallback(
        (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
            if (!workspaceSlug || !projectId) return;
            updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
        },
        [workspaceSlug, projectId, updateFilters]
    );

    const handleDisplayProperties = useCallback(
        (property: Partial<IIssueDisplayProperties>) => {
            if (!workspaceSlug || !projectId) return;
            updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property);
        },
        [workspaceSlug, projectId, updateFilters]
    );

    return (
        <>
            <ProjectAnalyticsModal
                isOpen={analyticsModal}
                onClose={() => setAnalyticsModal(false)}
                projectDetails={currentProjectDetails ?? undefined}
            />
            <div className="flex justify-evenly py-2 border-b border-custom-border-200 md:hidden">
                <CustomMenu
                    maxHeight={"md"}
                    className="flex flex-grow justify-center text-custom-text-200 text-sm"
                    placement="bottom-start"
                    customButton={<span className="flex flex-grow items-center justify-center text-custom-text-200 text-sm">
                        {showCurrentIcon != undefined && <showCurrentIcon.icon className="w-3.5 h-3.5 mr-2" />}
                        Layout
                    </span>}
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
        </>
    );
});
