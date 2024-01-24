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
import { ISSUES_TABS_LIST } from "constants/dashboard";

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

    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: filters.tab ?? widgetDetails.widget_filters.tab ?? "upcoming",
      target_date: getCustomDates(filters.target_date ?? widgetDetails.widget_filters.target_date ?? "this_week"),
      expand: "issue_relation",
    }).finally(() => setFetching(false));
  };

  useEffect(() => {
    const filterDates = getCustomDates(widgetDetails?.widget_filters.target_date ?? "this_week");

    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: widgetDetails?.widget_filters.tab ?? "upcoming",
      target_date: filterDates,
      expand: "issue_relation",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterParams = getRedirectionFilters(widgetDetails?.widget_filters.tab ?? "upcoming");

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300 flex flex-col min-h-96">
      <div className="flex items-start justify-between gap-2 p-6 pl-7">
        <div>
          <Link
            href={`/${workspaceSlug}/workspace-views/assigned/${filterParams}`}
            className="text-lg font-semibold text-custom-text-300 hover:underline"
          >
            Assigned to you
          </Link>
          <p className="mt-3 text-xs font-medium text-custom-text-300">
            Filtered by{" "}
            <span className="border-[0.5px] border-custom-border-300 rounded py-1 px-2 ml-0.5">Due date</span>
          </p>
        </div>
        <DurationFilterDropdown
          value={widgetDetails.widget_filters.target_date ?? "this_week"}
          onChange={(val) =>
            handleUpdateFilters({
              target_date: val,
            })
          }
        />
      </div>
      <Tab.Group
        as="div"
        defaultIndex={ISSUES_TABS_LIST.findIndex((t) => t.key === widgetDetails.widget_filters.tab ?? "upcoming")}
        onChange={(i) => {
          const selectedTab = ISSUES_TABS_LIST[i];
          handleUpdateFilters({ tab: selectedTab.key ?? "upcoming" });
        }}
        className="h-full flex flex-col"
      >
        <div className="px-6">
          <TabsList />
        </div>
        <Tab.Panels as="div" className="h-full">
          {ISSUES_TABS_LIST.map((tab) => (
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
