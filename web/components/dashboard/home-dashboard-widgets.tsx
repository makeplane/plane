import { observer } from "mobx-react-lite";
// types
import { TWidgetKeys } from "@plane/types";
// components
import {
  AssignedIssuesWidget,
  CreatedIssuesWidget,
  IssuesByPriorityWidget,
  IssuesByStateGroupWidget,
  OverviewStatsWidget,
  RecentActivityWidget,
  RecentCollaboratorsWidget,
  RecentProjectsWidget,
  WidgetProps,
} from "@/components/dashboard";
// hooks
import { useAppRouter, useDashboard } from "@/hooks/store";

const WIDGETS_LIST: {
  [key in TWidgetKeys]: { component: React.FC<WidgetProps>; fullWidth: boolean };
} = {
  overview_stats: { component: OverviewStatsWidget, fullWidth: true },
  assigned_issues: { component: AssignedIssuesWidget, fullWidth: false },
  created_issues: { component: CreatedIssuesWidget, fullWidth: false },
  issues_by_state_groups: { component: IssuesByStateGroupWidget, fullWidth: false },
  issues_by_priority: { component: IssuesByPriorityWidget, fullWidth: false },
  recent_activity: { component: RecentActivityWidget, fullWidth: false },
  recent_projects: { component: RecentProjectsWidget, fullWidth: false },
  recent_collaborators: { component: RecentCollaboratorsWidget, fullWidth: true },
};

export const DashboardWidgets = observer(() => {
  // store hooks
  const { workspaceSlug } = useAppRouter();
  const { homeDashboardId, homeDashboardWidgets } = useDashboard();

  const doesWidgetExist = (widgetKey: TWidgetKeys) =>
    Boolean(homeDashboardWidgets?.find((widget) => widget.key === widgetKey));

  if (!workspaceSlug || !homeDashboardId) return null;

  return (
    <div className="relative flex flex-col lg:grid lg:grid-cols-2 gap-7">
      {Object.entries(WIDGETS_LIST).map(([key, widget]) => {
        const WidgetComponent = widget.component;
        // if the widget doesn't exist, return null
        if (!doesWidgetExist(key as TWidgetKeys)) return null;
        // if the widget is full width, return it in a 2 column grid
        if (widget.fullWidth)
          return (
            <div key={key} className="lg:col-span-2">
              <WidgetComponent dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
            </div>
          );
        else return <WidgetComponent key={key} dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />;
      })}
    </div>
  );
});
