import { useEffect, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Tab } from "@headlessui/react";
// hooks
import { useDashboard } from "hooks/store";
// components
import { CreatedIssuesList, DurationFilterDropdown, TabsList, WidgetLoader } from "components/dashboard/widgets";
// helpers
import { getCustomDates, getRedirectionFilters } from "helpers/dashboard.helper";
// types
import { TCreatedIssuesWidgetFilters, TCreatedIssuesWidgetResponse } from "@plane/types";
// constants
import { ISSUES_TABS_LIST } from "constants/dashboard";

type Props = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "created_issues";

export const CreatedIssuesWidget: React.FC<Props> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [fetching, setFetching] = useState(false);
  // store hooks
  const {
    fetchWidgetStats,
    widgetDetails: allWidgetDetails,
    widgetStats: allWidgetStats,
    updateDashboardWidgetFilters,
  } = useDashboard();
  // derived values
  const widgetDetails = allWidgetDetails?.[workspaceSlug]?.[dashboardId]?.find((w) => w.key === WIDGET_KEY);
  const widgetStats = allWidgetStats?.[workspaceSlug]?.[dashboardId]?.[WIDGET_KEY] as TCreatedIssuesWidgetResponse;

  const handleUpdateFilters = async (filters: Partial<TCreatedIssuesWidgetFilters>) => {
    if (!widgetDetails) return;

    setFetching(true);

    await updateDashboardWidgetFilters(workspaceSlug, dashboardId, widgetDetails.id, {
      widgetKey: WIDGET_KEY,
      filters,
    });

    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      issue_type: widgetDetails.widget_filters.tab ?? "upcoming",
      target_date: getCustomDates(widgetDetails.widget_filters.target_date ?? "this_week"),
    }).finally(() => setFetching(false));
  };

  useEffect(() => {
    if (!widgetDetails) return;

    if (!widgetStats)
      fetchWidgetStats(workspaceSlug, dashboardId, {
        widget_key: WIDGET_KEY,
        issue_type: widgetDetails.widget_filters.tab ?? "upcoming",
        target_date: getCustomDates(widgetDetails.widget_filters.target_date ?? "this_week"),
      });
  }, [dashboardId, fetchWidgetStats, widgetDetails, widgetStats, workspaceSlug]);

  const filterParams = getRedirectionFilters(widgetDetails?.widget_filters.tab ?? "upcoming");
  const redirectionLink = `/${workspaceSlug}/workspace-views/created/${filterParams}`;

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300 flex flex-col">
      <Link href={redirectionLink} className="flex items-center justify-between gap-2 p-6 pl-7">
        <h4 className="text-lg font-semibold text-custom-text-300">All issues created</h4>
        <DurationFilterDropdown
          value={widgetDetails.widget_filters.target_date ?? "this_week"}
          onChange={(val) =>
            handleUpdateFilters({
              target_date: val,
            })
          }
        />
      </Link>
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
        <Tab.Panels as="div" className="mt-7 h-full">
          <Tab.Panel as="div" className="h-full flex flex-col">
            <CreatedIssuesList
              filter={widgetDetails.widget_filters.target_date}
              issues={widgetStats.issues}
              totalIssues={widgetStats.count}
              type="upcoming"
              workspaceSlug={workspaceSlug}
              isLoading={fetching}
            />
          </Tab.Panel>
          <Tab.Panel as="div" className="h-full flex flex-col">
            <CreatedIssuesList
              filter={widgetDetails.widget_filters.target_date}
              issues={widgetStats.issues}
              totalIssues={widgetStats.count}
              type="overdue"
              workspaceSlug={workspaceSlug}
              isLoading={fetching}
            />
          </Tab.Panel>
          <Tab.Panel as="div" className="h-full flex flex-col">
            <CreatedIssuesList
              filter={widgetDetails.widget_filters.target_date}
              issues={widgetStats.issues}
              totalIssues={widgetStats.count}
              type="completed"
              workspaceSlug={workspaceSlug}
              isLoading={fetching}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
