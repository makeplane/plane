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
import { TAssignedIssuesWidgetFilters, TAssignedIssuesWidgetResponse } from "@plane/types";
// constants
import { FILTERED_ISSUES_TABS_LIST, UNFILTERED_ISSUES_TABS_LIST } from "constants/dashboard";

const WIDGET_KEY = "assigned_issues";

export const AssignedIssuesWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [fetching, setFetching] = useState(false);
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, updateDashboardWidgetFilters } = useDashboard();
  // derived values
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TAssignedIssuesWidgetResponse>(workspaceSlug, dashboardId, WIDGET_KEY);

  const handleUpdateFilters = async (filters: Partial<TAssignedIssuesWidgetFilters>) => {
    if (!widgetDetails) return;

    setFetching(true);

    await updateDashboardWidgetFilters(workspaceSlug, dashboardId, widgetDetails.id, {
      widgetKey: WIDGET_KEY,
      filters,
    });

    const filterDates = getCustomDates(filters.target_date ?? widgetDetails.widget_filters.target_date ?? "none");
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: filters.tab ?? widgetDetails.widget_filters.tab ?? "pending",
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
      expand: "issue_relation",
    }).finally(() => setFetching(false));
  };

  useEffect(() => {
    const filterDates = getCustomDates(widgetDetails?.widget_filters.target_date ?? "none");

    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: widgetDetails?.widget_filters.tab ?? "pending",
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
      expand: "issue_relation",
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterParams = getRedirectionFilters(widgetDetails?.widget_filters.tab ?? "pending");
  const tabsList =
    widgetDetails?.widget_filters.target_date ?? "none" ? UNFILTERED_ISSUES_TABS_LIST : FILTERED_ISSUES_TABS_LIST;

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300 flex flex-col min-h-96">
      <div className="flex items-center justify-between gap-2 p-6 pl-7">
        <Link
          href={`/${workspaceSlug}/workspace-views/assigned/${filterParams}`}
          className="text-lg font-semibold text-custom-text-300 hover:underline"
        >
          Assigned to you
        </Link>
        <DurationFilterDropdown
          value={widgetDetails.widget_filters.target_date ?? "none"}
          onChange={(val) => {
            if (val === widgetDetails.widget_filters.target_date) return;
            let extraOptions: Partial<TAssignedIssuesWidgetFilters> = {};

            // switch to pending tab if target date is changed to none
            if (val === "none" && widgetDetails.widget_filters.tab !== "completed") extraOptions = { tab: "pending" };
            // switch to upcoming tab if target date is changed to other than none
            if (
              val !== "none" &&
              widgetDetails.widget_filters.target_date === "none" &&
              widgetDetails.widget_filters.tab !== "completed"
            )
              extraOptions = { tab: "upcoming" };

            handleUpdateFilters({
              target_date: val,
              ...extraOptions,
            });
          }}
        />
      </div>
      <Tab.Group
        as="div"
        // selectedIndex={selectedIndex}
        defaultIndex={tabsList.findIndex((t) => t.key === widgetDetails.widget_filters.tab ?? "pending")}
        onChange={(i) => {
          const selectedTab = tabsList[i];
          handleUpdateFilters({ tab: selectedTab?.key ?? "pending" });
          // setSelectedIndex(i);
        }}
        className="h-full flex flex-col"
      >
        <div className="px-6">
          <TabsList
            durationFilter={widgetDetails.widget_filters.target_date ?? "none"}
            selectedTab={widgetDetails.widget_filters.tab ?? "pending"}
          />
        </div>
        <Tab.Panels as="div" className="h-full">
          {tabsList.map((tab) => (
            <Tab.Panel key={tab.key} as="div" className="h-full flex flex-col">
              <WidgetIssuesList
                issues={widgetStats.issues}
                tab={tab.key}
                totalIssues={widgetStats.count}
                type="assigned"
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
