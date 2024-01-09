import { useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Tab } from "@headlessui/react";
// hooks
import { useDashboard } from "hooks/store";
// components
import { AssignedIssuesWidgetLoader, CreatedIssuesList, TABS_LIST } from "components/dashboard/widgets";
// helpers
import { cn } from "helpers/common.helper";
// types
import { ICreatedIssuesWidgetResponse } from "@plane/types";

type Props = {
  dashboardId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "created_issues";

export const CreatedIssuesWidget: React.FC<Props> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { getWidgetStats, fetchWidgetStats, widgetStats: allWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<ICreatedIssuesWidgetResponse>(workspaceSlug, dashboardId, WIDGET_KEY);

  useEffect(() => {
    if (!widgetStats) fetchWidgetStats(workspaceSlug, dashboardId, WIDGET_KEY);
  }, [dashboardId, fetchWidgetStats, widgetStats, workspaceSlug]);

  console.log("allWidgetStats", allWidgetStats);

  const redirectionLink = `/${workspaceSlug}/workspace-views/assigned`;

  if (!widgetStats) return <AssignedIssuesWidgetLoader />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300">
      <Link href={redirectionLink} className="flex items-center justify-between gap-2 px-7 py-6">
        <h4 className="text-lg font-semibold text-custom-text-300">All issues created</h4>
      </Link>
      <Tab.Group as="div">
        <div className="px-6">
          <Tab.List
            as="div"
            className="border-[0.5px] border-custom-border-200 rounded grid grid-cols-3 bg-custom-background-80"
          >
            {TABS_LIST.map((tab) => (
              <Tab
                key={tab.key}
                className={({ selected }) =>
                  cn("font-semibold text-xs rounded py-1.5 focus:outline-none", {
                    "bg-custom-background-100 text-custom-text-300": selected,
                    "text-custom-text-400": !selected,
                    // TODO: add box shadow for selected state
                  })
                }
              >
                {tab.label}
              </Tab>
            ))}
          </Tab.List>
        </div>
        <Tab.Panels as="div" className="mt-7 pb-3">
          <Tab.Panel>
            <CreatedIssuesList
              issues={widgetStats.upcoming_issues}
              totalIssues={widgetStats.upcoming_issues_count}
              type="upcoming"
              workspaceSlug={workspaceSlug}
            />
          </Tab.Panel>
          <Tab.Panel>
            <CreatedIssuesList
              issues={widgetStats.overdue_issues}
              totalIssues={widgetStats.overdue_issues_count}
              type="overdue"
              workspaceSlug={workspaceSlug}
            />
          </Tab.Panel>
          <Tab.Panel>
            <CreatedIssuesList
              issues={widgetStats.completed_issues}
              totalIssues={widgetStats.completed_issues_count}
              type="completed"
              workspaceSlug={workspaceSlug}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
