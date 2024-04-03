import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Tab } from "@headlessui/react";
import { TCreatedIssuesWidgetFilters, TCreatedIssuesWidgetResponse } from "@plane/types";
// hooks
import {
  DurationFilterDropdown,
  IssuesErrorState,
  TabsList,
  WidgetIssuesList,
  WidgetLoader,
  WidgetProps,
} from "@/components/dashboard/widgets";
import { EDurationFilters, FILTERED_ISSUES_TABS_LIST, UNFILTERED_ISSUES_TABS_LIST } from "@/constants/dashboard";
import { getCustomDates, getRedirectionFilters, getTabKey } from "@/helpers/dashboard.helper";
import { useDashboard } from "@/hooks/store";
// components
// helpers
// types
// constants

const WIDGET_KEY = "created_issues";

export const CreatedIssuesWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [fetching, setFetching] = useState(false);
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, getWidgetStatsError, updateDashboardWidgetFilters } =
    useDashboard();
  // derived values
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TCreatedIssuesWidgetResponse>(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStatsError = getWidgetStatsError(workspaceSlug, dashboardId, WIDGET_KEY);
  const selectedDurationFilter = widgetDetails?.widget_filters.duration ?? EDurationFilters.NONE;
  const selectedTab = getTabKey(selectedDurationFilter, widgetDetails?.widget_filters.tab);
  const selectedCustomDates = widgetDetails?.widget_filters.custom_dates ?? [];

  const handleUpdateFilters = async (filters: Partial<TCreatedIssuesWidgetFilters>) => {
    if (!widgetDetails) return;

    setFetching(true);

    await updateDashboardWidgetFilters(workspaceSlug, dashboardId, widgetDetails.id, {
      widgetKey: WIDGET_KEY,
      filters,
    });

    const filterDates = getCustomDates(
      filters.duration ?? selectedDurationFilter,
      filters.custom_dates ?? selectedCustomDates
    );
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: filters.tab ?? selectedTab,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    }).finally(() => setFetching(false));
  };

  useEffect(() => {
    const filterDates = getCustomDates(selectedDurationFilter, selectedCustomDates);

    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: selectedTab,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterParams = getRedirectionFilters(selectedTab);
  const tabsList = selectedDurationFilter === "none" ? UNFILTERED_ISSUES_TABS_LIST : FILTERED_ISSUES_TABS_LIST;
  const selectedTabIndex = tabsList.findIndex((tab) => tab.key === selectedTab);

  if ((!widgetDetails || !widgetStats) && !widgetStatsError) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300 flex flex-col min-h-96">
      {widgetStatsError ? (
        <IssuesErrorState
          isRefreshing={fetching}
          onClick={() =>
            handleUpdateFilters({
              duration: EDurationFilters.NONE,
              tab: "pending",
            })
          }
        />
      ) : (
        widgetStats && (
          <>
            <div className="flex items-center justify-between gap-2 p-6 pl-7">
              <Link
                href={`/${workspaceSlug}/workspace-views/created/${filterParams}`}
                className="text-lg font-semibold text-custom-text-300 hover:underline"
              >
                Created by you
              </Link>
              <DurationFilterDropdown
                customDates={selectedCustomDates}
                value={selectedDurationFilter}
                onChange={(val, customDates) => {
                  if (val === "custom" && customDates) {
                    handleUpdateFilters({
                      duration: val,
                      custom_dates: customDates,
                    });
                    return;
                  }

                  if (val === selectedDurationFilter) return;

                  let newTab = selectedTab;
                  // switch to pending tab if target date is changed to none
                  if (val === "none" && selectedTab !== "completed") newTab = "pending";
                  // switch to upcoming tab if target date is changed to other than none
                  if (val !== "none" && selectedDurationFilter === "none" && selectedTab !== "completed")
                    newTab = "upcoming";

                  handleUpdateFilters({
                    duration: val,
                    tab: newTab,
                  });
                }}
              />
            </div>
            <Tab.Group
              as="div"
              selectedIndex={selectedTabIndex}
              onChange={(i) => {
                const newSelectedTab = tabsList[i];
                handleUpdateFilters({ tab: newSelectedTab.key ?? "completed" });
              }}
              className="h-full flex flex-col"
            >
              <div className="px-6">
                <TabsList durationFilter={selectedDurationFilter} selectedTab={selectedTab} />
              </div>
              <Tab.Panels as="div" className="h-full">
                {tabsList.map((tab) => {
                  if (tab.key !== selectedTab) return null;

                  return (
                    <Tab.Panel key={tab.key} as="div" className="h-full flex flex-col" static>
                      <WidgetIssuesList
                        tab={tab.key}
                        type="created"
                        workspaceSlug={workspaceSlug}
                        widgetStats={widgetStats}
                        isLoading={fetching}
                      />
                    </Tab.Panel>
                  );
                })}
              </Tab.Panels>
            </Tab.Group>
          </>
        )
      )}
    </div>
  );
});
