import { useEffect, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Tab } from "@headlessui/react";
// hooks
import { useDashboard } from "hooks/store";
// components
import {
  DurationFilterDropdown,
  TabsList,
  WidgetIssuesList,
  WidgetLoader,
  WidgetProps,
} from "components/dashboard/widgets";
// helpers
import { getCustomDates, getRedirectionFilters } from "helpers/dashboard.helper";
// types
import { TCreatedIssuesWidgetFilters, TCreatedIssuesWidgetResponse } from "@plane/types";
// constants
import { FILTERED_ISSUES_TABS_LIST, UNFILTERED_ISSUES_TABS_LIST } from "constants/dashboard";

const WIDGET_KEY = "created_issues";

export const CreatedIssuesWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [fetching, setFetching] = useState(false);
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, updateDashboardWidgetFilters } = useDashboard();
  // derived values
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TCreatedIssuesWidgetResponse>(workspaceSlug, dashboardId, WIDGET_KEY);
  const selectedTab = widgetDetails?.widget_filters.tab ?? "pending";
  const selectedDurationFilter = widgetDetails?.widget_filters.target_date ?? "none";

  const handleUpdateFilters = async (filters: Partial<TCreatedIssuesWidgetFilters>) => {
    if (!widgetDetails) return;

    setFetching(true);

    await updateDashboardWidgetFilters(workspaceSlug, dashboardId, widgetDetails.id, {
      widgetKey: WIDGET_KEY,
      filters,
    });

    const filterDates = getCustomDates(filters.target_date ?? selectedDurationFilter);
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: filters.tab ?? selectedTab,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    }).finally(() => setFetching(false));
  };

  useEffect(() => {
    const filterDates = getCustomDates(selectedDurationFilter);

    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: selectedTab,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterParams = getRedirectionFilters(selectedTab);
  const tabsList = selectedDurationFilter === "none" ? UNFILTERED_ISSUES_TABS_LIST : FILTERED_ISSUES_TABS_LIST;

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300 flex flex-col min-h-96">
      <div className="flex items-center justify-between gap-2 p-6 pl-7">
        <Link
          href={`/${workspaceSlug}/workspace-views/created/${filterParams}`}
          className="text-lg font-semibold text-custom-text-300 hover:underline"
        >
          Created by you
        </Link>
        <DurationFilterDropdown
          value={selectedDurationFilter}
          onChange={(val) => {
            if (val === selectedDurationFilter) return;

            // switch to pending tab if target date is changed to none
            if (val === "none" && selectedTab !== "completed") {
              handleUpdateFilters({ target_date: val, tab: "pending" });
              return;
            }
            // switch to upcoming tab if target date is changed to other than none
            if (val !== "none" && selectedDurationFilter === "none" && selectedTab !== "completed") {
              handleUpdateFilters({
                target_date: val,
                tab: "upcoming",
              });
              return;
            }

            handleUpdateFilters({ target_date: val });
          }}
        />
      </div>
      <Tab.Group
        as="div"
        selectedIndex={tabsList.findIndex((tab) => tab.key === selectedTab)}
        onChange={(i) => {
          const selectedTab = tabsList[i];
          handleUpdateFilters({ tab: selectedTab.key ?? "pending" });
        }}
        className="h-full flex flex-col"
      >
        <div className="px-6">
          <TabsList durationFilter={selectedDurationFilter} selectedTab={selectedTab} />
        </div>
        <Tab.Panels as="div" className="h-full">
          {tabsList.map((tab) => (
            <Tab.Panel key={tab.key} as="div" className="h-full flex flex-col">
              <WidgetIssuesList
                issues={widgetStats.issues}
                tab={tab.key}
                totalIssues={widgetStats.count}
                type="created"
                workspaceSlug={workspaceSlug}
                isLoading={fetching}
              />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
