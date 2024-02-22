import { useCallback } from "react";
import { useRouter } from "next/router";
// components
import { DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "components/issues";
// hooks
import { useIssues, useLabel } from "hooks/store";
// constants
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
import { EIssueFilterType, EIssuesStoreType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT, ISSUE_LAYOUTS } from "constants/issue";
import { CustomMenu } from "@plane/ui";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";

export const ProfileMobileHeader = observer(() => {
    const layouts = ["list", "kanban"];

    // router
    const router = useRouter();
    const { workspaceSlug, userId } = router.query;
    // store hook
    const {
        issuesFilter: { issueFilters, updateFilters },
    } = useIssues(EIssuesStoreType.PROFILE);

    const { workspaceLabels } = useLabel();
    // derived values
    const states = undefined;
    const members = undefined;
    const activeLayout = issueFilters?.displayFilters?.layout;

    const showCurrentIcon = ISSUE_LAYOUTS.find((layout) => layout.key === activeLayout);

    const handleLayoutChange = useCallback(
        (layout: TIssueLayouts) => {
            if (!workspaceSlug || !userId) return;
            updateFilters(
                workspaceSlug.toString(),
                undefined,
                EIssueFilterType.DISPLAY_FILTERS,
                { layout: layout },
                userId.toString()
            );
        },
        [workspaceSlug, updateFilters, userId]
    );

    const handleFiltersUpdate = useCallback(
        (key: keyof IIssueFilterOptions, value: string | string[]) => {
            if (!workspaceSlug || !userId) return;
            const newValues = issueFilters?.filters?.[key] ?? [];

            if (Array.isArray(value)) {
                value.forEach((val) => {
                    if (!newValues.includes(val)) newValues.push(val);
                });
            } else {
                if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
                else newValues.push(value);
            }

            updateFilters(
                workspaceSlug.toString(),
                undefined,
                EIssueFilterType.FILTERS,
                { [key]: newValues },
                userId.toString()
            );
        },
        [workspaceSlug, issueFilters, updateFilters, userId]
    );

    const handleDisplayFilters = useCallback(
        (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
            if (!workspaceSlug || !userId) return;
            updateFilters(
                workspaceSlug.toString(),
                undefined,
                EIssueFilterType.DISPLAY_FILTERS,
                updatedDisplayFilter,
                userId.toString()
            );
        },
        [workspaceSlug, updateFilters, userId]
    );

    const handleDisplayProperties = useCallback(
        (property: Partial<IIssueDisplayProperties>) => {
            if (!workspaceSlug || !userId) return;
            updateFilters(
                workspaceSlug.toString(),
                undefined,
                EIssueFilterType.DISPLAY_PROPERTIES,
                property,
                userId.toString()
            );
        },
        [workspaceSlug, updateFilters, userId]
    );
    return (
        (router.pathname.includes("assigned") ||
            router.pathname.includes("created") ||
            router.pathname.includes("subscribed")) && (
            <div className="flex z-[5] justify-evenly py-2 border-b border-custom-border-200 md:hidden">
                <CustomMenu
                    maxHeight={"md"}
                    className="flex flex-grow justify-center text-custom-text-200 text-sm"
                    placement="bottom-start"
                    customButton={
                        <span className="flex flex-grow justify-center items-center text-custom-text-200 text-sm">
                            {showCurrentIcon != undefined && <showCurrentIcon.icon className="w-3.5 h-3.5 mr-2" />}
                            Layout
                        </span>
                    }
                    customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
                    closeOnSelect
                >
                    {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
                        <CustomMenu.MenuItem
                            onClick={() => {
                                handleLayoutChange(layout.key);
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
                            <span className="flex w-full items-center text-custom-text-200 text-sm">
                                Filters
                                <ChevronDown className="text-custom-text-200  h-4 w-4 ml-2" />
                            </span>
                        }
                    >
                        <FilterSelection
                            layoutDisplayFiltersOptions={
                                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
                            }
                            filters={issueFilters?.filters ?? {}}
                            handleFiltersUpdate={handleFiltersUpdate}
                            states={states}
                            labels={workspaceLabels}
                            memberIds={members}
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
                                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.profile_issues[activeLayout] : undefined
                            }
                            displayFilters={issueFilters?.displayFilters ?? {}}
                            handleDisplayFiltersUpdate={handleDisplayFilters}
                            displayProperties={issueFilters?.displayProperties ?? {}}
                            handleDisplayPropertiesUpdate={handleDisplayProperties}
                        />
                    </FiltersDropdown>
                </div>
            </div>
        )
    );
});
